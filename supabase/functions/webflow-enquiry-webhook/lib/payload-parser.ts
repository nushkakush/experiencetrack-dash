import type { WebflowWebhookPayload, ParsedSubmissionData } from './types.ts';

/**
 * Parse Webflow webhook payload from different formats
 */
export class PayloadParser {
  /**
   * Parse webhook request and extract form submission data
   */
  static async parseWebhookRequest(req: Request): Promise<{
    success: boolean;
    data?: ParsedSubmissionData;
    error?: string;
    rawPayload?: any;
  }> {
    let payload: WebflowWebhookPayload;
    let rawBody: string;

    const contentType = req.headers.get('content-type') || '';
    console.log('📋 Content-Type:', contentType);

    try {
      rawBody = await req.text();
      console.log(
        '📨 Raw webhook payload received (first 1000 chars):',
        rawBody.substring(0, 1000)
      );

      // Parse based on content type
      if (contentType.includes('application/json')) {
        payload = JSON.parse(rawBody);
        console.log('📋 Parsed as JSON:', JSON.stringify(payload, null, 2));
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Parse form data
        const formData = new URLSearchParams(rawBody);
        payload = Object.fromEntries(formData.entries()) as any;
        console.log(
          '📋 Parsed as form data:',
          JSON.stringify(payload, null, 2)
        );
      } else {
        // Try JSON first, then form data
        try {
          payload = JSON.parse(rawBody);
          console.log('📋 Successfully parsed as JSON (no content-type)');
        } catch {
          const formData = new URLSearchParams(rawBody);
          payload = Object.fromEntries(formData.entries()) as any;
          console.log('📋 Successfully parsed as form data (no content-type)');
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError);
      console.error('❌ Raw body was:', rawBody?.substring(0, 500));
      console.error('❌ Content-Type was:', contentType);

      return {
        success: false,
        error: `Failed to parse payload: ${parseError.message}`,
        rawPayload: { contentType, receivedData: rawBody?.substring(0, 500) },
      };
    }

    console.log('✅ Webflow webhook received:', {
      name: payload.name,
      site: payload.site,
      formId: payload.data?.formId,
      dateSubmitted: payload.data?.dateSubmitted,
      fullPayloadStructure: Object.keys(payload),
    });

    // Extract submission data from different payload formats
    const submissionData = this.extractSubmissionData(payload);

    console.log(
      '📋 Submission data structure:',
      JSON.stringify(submissionData, null, 2)
    );

    return {
      success: true,
      data: submissionData,
      rawPayload: payload,
    };
  }

  /**
   * Extract submission data from different Webflow payload formats
   */
  private static extractSubmissionData(
    payload: WebflowWebhookPayload
  ): ParsedSubmissionData {
    // Check different payload formats and extract submission data
    if (payload.triggerType === 'form_submission' && payload.payload) {
      // New Webflow webhook format
      return {
        formId: payload.payload.formId,
        formResponse: payload.payload.data,
        dateSubmitted: payload.payload.submittedAt,
        siteId: payload.payload.siteId,
      };
    } else if (payload.data && payload.data.formResponse) {
      // Expected Webflow API format
      return payload.data;
    } else if (payload.formResponse || payload.name || payload.email) {
      // Direct form data format
      return {
        formId: payload.formId || 'unknown',
        formResponse: payload,
        dateSubmitted: payload.dateSubmitted || new Date().toISOString(),
        siteId: payload.siteId || 'unknown',
      };
    } else {
      // Try to use the payload as-is and see what happens
      return {
        formId: 'unknown',
        formResponse: payload,
        dateSubmitted: new Date().toISOString(),
        siteId: 'unknown',
      };
    }
  }
}
