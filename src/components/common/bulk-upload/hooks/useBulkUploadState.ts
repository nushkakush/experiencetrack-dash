import { useReducer } from 'react';
import { BulkUploadState, BulkUploadAction } from '../types';

const initialState: BulkUploadState = {
  isOpen: false,
  isDragOver: false,
  selectedFile: null,
  validationResult: null,
  isProcessing: false,
  isUploading: false,
  duplicateHandling: 'ignore',
  currentStep: 'upload',
};

function bulkUploadReducer(state: BulkUploadState, action: BulkUploadAction): BulkUploadState {
  switch (action.type) {
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    case 'SET_DRAG_OVER':
      return { ...state, isDragOver: action.payload };
    case 'SET_FILE':
      return { ...state, selectedFile: action.payload };
    case 'SET_VALIDATION_RESULT':
      return { ...state, validationResult: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_UPLOADING':
      return { ...state, isUploading: action.payload };
    case 'SET_DUPLICATE_HANDLING':
      return { ...state, duplicateHandling: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET':
      return { 
        ...initialState, 
        isOpen: state.isOpen // Keep dialog open state
      };
    default:
      return state;
  }
}

export const useBulkUploadState = () => {
  const [state, dispatch] = useReducer(bulkUploadReducer, initialState);

  const actions = {
    setOpen: (isOpen: boolean) => dispatch({ type: 'SET_OPEN', payload: isOpen }),
    setDragOver: (isDragOver: boolean) => dispatch({ type: 'SET_DRAG_OVER', payload: isDragOver }),
    setFile: (file: File | null) => dispatch({ type: 'SET_FILE', payload: file }),
    setValidationResult: (result: any) => dispatch({ type: 'SET_VALIDATION_RESULT', payload: result }),
    setProcessing: (processing: boolean) => dispatch({ type: 'SET_PROCESSING', payload: processing }),
    setUploading: (uploading: boolean) => dispatch({ type: 'SET_UPLOADING', payload: uploading }),
    setDuplicateHandling: (handling: 'ignore' | 'overwrite') => 
      dispatch({ type: 'SET_DUPLICATE_HANDLING', payload: handling }),
    setStep: (step: 'upload' | 'validate' | 'confirm') => 
      dispatch({ type: 'SET_STEP', payload: step }),
    reset: () => dispatch({ type: 'RESET' }),
  };

  return { state, actions };
};
