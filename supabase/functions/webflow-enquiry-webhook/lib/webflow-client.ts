import type { WebflowForm, WebflowFormsResponse } from './types.ts';

/**
 * Webflow API client for fetching form information
 */
export class WebflowClient {
  private apiToken: string;
  private siteId: string;
  private baseUrl = 'https://api.webflow.com/v2';

  constructor(apiToken: string, siteId: string) {
    this.apiToken = apiToken;
    this.siteId = siteId;
  }

  /**
   * Get form name by form ID from Webflow API
   */
  async getFormName(formId: string): Promise<string> {
    try {
      console.log(`🔍 Looking up form name for ID: ${formId}`);

      const headers = {
        Authorization: `Bearer ${this.apiToken}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json',
      };

      const formsResponse = await fetch(
        `${this.baseUrl}/sites/${this.siteId}/forms`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!formsResponse.ok) {
        console.warn(
          'Failed to fetch forms from Webflow, using fallback form name'
        );
        return `Form ${formId}`;
      }

      const formsData: WebflowFormsResponse = await formsResponse.json();
      const forms = formsData.forms || [];

      console.log(
        `📋 Available forms:`,
        forms.map((f: WebflowForm) => ({
          id: f.id,
          displayName: f.displayName,
        }))
      );

      // Find the form with matching ID
      const form = forms.find((f: WebflowForm) => f.id === formId);

      if (form) {
        const formName = form.displayName || form.name || `Form ${formId}`;
        console.log(`✅ Found form: ${formId} → ${formName}`);
        return formName;
      }

      console.warn(`❌ Form not found for ID: ${formId}`);
      return `Form ${formId}`;
    } catch (error) {
      console.error('Error fetching form name:', error);
      return `Form ${formId}`;
    }
  }

  /**
   * Create a Webflow client from environment variables
   */
  static fromEnvironment(): WebflowClient | null {
    const tokenData = Deno.env.get('WEBFLOW_API_TOKEN');
    const siteIdData = Deno.env.get('WEBFLOW_SITE_ID');

    if (!tokenData || !siteIdData) {
      console.warn(
        'Webflow API credentials not found in environment variables'
      );
      return null;
    }

    return new WebflowClient(tokenData, siteIdData);
  }
}
