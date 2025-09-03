import type { ConditionTree, ConditionOption, RubricSection } from './experience';

// Utility functions for condition handling
export const generateConditionFields = (rubricSections: RubricSection[]): ConditionOption[] => {
  const fields: ConditionOption[] = [
    {
      value: 'overall_score',
      label: 'Overall Score',
      type: 'overall_score'
    }
  ];

  // Add rubric sections (rubric groups)
  rubricSections.forEach(section => {
    fields.push({
      value: `section_${section.id}`,
      label: `Rubric Group: ${section.title}`,
      type: 'rubric_section',
      reference: section.id
    });

    // Add individual criteria
    section.criteria.forEach(criteria => {
      fields.push({
        value: `criteria_${criteria.id}`,
        label: `Rubric Criteria: ${section.title} → ${criteria.name}`,
        type: 'rubric_criteria',
        reference: criteria.id
      });
    });
  });

  return fields;
};

export const createEmptyCondition = (): ConditionTree => ({
  id: crypto.randomUUID(),
  type: 'condition',
  field_type: 'overall_score',
  comparison_operator: '>=',
  value: 0,
  description: ''
});

export const createEmptyGroup = (): ConditionTree => ({
  id: crypto.randomUUID(),
  type: 'group',
  operator: 'AND',
  conditions: [createEmptyCondition()]
});

export const generateConditionDescription = (
  conditions: ConditionTree,
  availableFields: ConditionOption[]
): string => {
  if (conditions.type === 'condition') {
    const field = availableFields.find(f => f.value === getFieldValue(conditions));
    const operator = conditions.comparison_operator;
    const value = conditions.value;
    
    if (!field || !operator || value === undefined) return '';
    
    const operatorSymbols: Record<string, string> = {
      '>=': '≥',
      '<=': '≤',
      '>': '>',
      '<': '<',
      '=': '=',
      '!=': '≠'
    };
    
    const baseDescription = `${field.label} ${operatorSymbols[operator]} ${value}`;
    
    // Add "No" prefix for negative conditions with better phrasing
    if (conditions.is_negative) {
      if (field.type === 'rubric_section') {
        return `No ${field.label} ${operatorSymbols[operator]} ${value}`;
      } else if (field.type === 'rubric_criteria') {
        return `No ${field.label} ${operatorSymbols[operator]} ${value}`;
      } else {
        return `No ${baseDescription}`;
      }
    }
    
    return baseDescription;
  }
  
  if (conditions.type === 'group' && conditions.conditions && conditions.conditions.length > 0) {
    const childDescriptions = conditions.conditions
      .map(child => generateConditionDescription(child, availableFields))
      .filter(desc => desc.length > 0);
    
    if (childDescriptions.length === 0) return '';
    if (childDescriptions.length === 1) return childDescriptions[0];
    
    const operator = conditions.operator === 'AND' ? ' AND ' : ' OR ';
    return `(${childDescriptions.join(operator)})`;
  }
  
  return '';
};

const getFieldValue = (condition: ConditionTree): string => {
  if (condition.field_type === 'overall_score') {
    return 'overall_score';
  } else if (condition.field_type === 'rubric_section' && condition.field_reference) {
    return `section_${condition.field_reference}`;
  } else if (condition.field_type === 'rubric_criteria' && condition.field_reference) {
    return `criteria_${condition.field_reference}`;
  }
  return '';
};

// Condition evaluation engine
export const evaluateConditions = (
  conditions: ConditionTree,
  scores: Record<string, number>
): boolean => {
  if (conditions.type === 'condition') {
    const fieldValue = getScoreValue(conditions, scores);
    if (fieldValue === undefined || conditions.value === undefined) return false;
    
    const result = compareValues(fieldValue, conditions.comparison_operator!, conditions.value);
    
    // If this is a negative condition, invert the result
    return conditions.is_negative ? !result : result;
  }
  
  if (conditions.type === 'group' && conditions.conditions) {
    const results = conditions.conditions.map(child => 
      evaluateConditions(child, scores)
    );
    
    return conditions.operator === 'AND' 
      ? results.every(r => r)
      : results.some(r => r);
  }
  
  return false;
};

const getScoreValue = (condition: ConditionTree, scores: Record<string, number>): number | undefined => {
  if (condition.field_type === 'overall_score') {
    return scores['overall_score'];
  } else if (condition.field_type === 'rubric_section' && condition.field_reference) {
    return scores[`section_${condition.field_reference}`];
  } else if (condition.field_type === 'rubric_criteria' && condition.field_reference) {
    return scores[`criteria_${condition.field_reference}`];
  }
  return undefined;
};

const compareValues = (actual: number, operator: string, expected: number): boolean => {
  switch (operator) {
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '>': return actual > expected;
    case '<': return actual < expected;
    case '=': return actual === expected;
    case '!=': return actual !== expected;
    default: return false;
  }
};

export const validateConditionTree = (conditions: ConditionTree): boolean => {
  if (conditions.type === 'condition') {
    return !!(
      conditions.field_type &&
      conditions.comparison_operator &&
      conditions.value !== undefined
    );
  }
  
  if (conditions.type === 'group') {
    return !!(
      conditions.operator &&
      conditions.conditions &&
      conditions.conditions.length > 0 &&
      conditions.conditions.every(validateConditionTree)
    );
  }
  
  return false;
};
