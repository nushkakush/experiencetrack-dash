import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Link, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface WYSIWYGEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Enter your content...',
  rows = 12
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Convert HTML to markdown-like format for storage
  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      .replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gs, (match, content) => {
        return content.replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n');
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gs, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>(.*?)<\/li>/g, () => `${counter++}. $1\n`);
      })
      .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
      .replace(/<div[^>]*>(.*?)<\/div>/g, '$1\n')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/\n\s*\n/g, '\n') // Clean up multiple newlines
      .trim();
  };

  // Convert markdown to HTML for display
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Wrap consecutive list items
      .replace(/(<li>.*<\/li>)/g, '<ul class="list-disc list-inside space-y-1 ml-4">$1</ul>')
      .replace(/(<ul[^>]*>.*?<\/ul>)\s*(<ul[^>]*>.*?<\/ul>)/gs, '$1$2')
      // Fix multiple ul tags
      .replace(/<\/ul>\s*<ul[^>]*>/g, '');
  };

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && value !== htmlToMarkdown(editorRef.current.innerHTML)) {
      if (value.trim() === '') {
        editorRef.current.innerHTML = '';
      } else {
        editorRef.current.innerHTML = markdownToHtml(value);
      }
    }
  }, [value]);

  // Handle placeholder display
  useEffect(() => {
    if (editorRef.current) {
      const element = editorRef.current;
      const showPlaceholder = () => {
        if (element.innerHTML.trim() === '' || element.innerHTML === '<br>') {
          element.setAttribute('data-placeholder', placeholder);
        } else {
          element.removeAttribute('data-placeholder');
        }
      };

      showPlaceholder();
      
      // Add event listeners
      element.addEventListener('input', showPlaceholder);
      element.addEventListener('blur', showPlaceholder);
      element.addEventListener('focus', showPlaceholder);

      return () => {
        element.removeEventListener('input', showPlaceholder);
        element.removeEventListener('blur', showPlaceholder);
        element.removeEventListener('focus', showPlaceholder);
      };
    }
  }, [placeholder]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${linkText}</a>`;
      execCommand('insertHTML', linkHtml);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const insertList = (ordered: boolean = false) => {
    if (ordered) {
      execCommand('insertOrderedList');
    } else {
      execCommand('insertUnorderedList');
    }
  };

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>{label}</Label>
      
      {/* Toolbar */}
      <div className='flex items-center space-x-1 p-2 border rounded-t-lg bg-muted/30'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('bold')}
          title='Bold'
        >
          <Bold className='h-4 w-4' />
        </Button>
        
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('italic')}
          title='Italic'
        >
          <Italic className='h-4 w-4' />
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('underline')}
          title='Underline'
        >
          <Underline className='h-4 w-4' />
        </Button>

        <div className='w-px h-6 bg-border mx-1' />

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('justifyLeft')}
          title='Align Left'
        >
          <AlignLeft className='h-4 w-4' />
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('justifyCenter')}
          title='Align Center'
        >
          <AlignCenter className='h-4 w-4' />
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => execCommand('justifyRight')}
          title='Align Right'
        >
          <AlignRight className='h-4 w-4' />
        </Button>

        <div className='w-px h-6 bg-border mx-1' />

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => insertList(false)}
          title='Bullet List'
        >
          <List className='h-4 w-4' />
        </Button>

        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={() => insertList(true)}
          title='Numbered List'
        >
          <ListOrdered className='h-4 w-4' />
        </Button>

        <div className='w-px h-6 bg-border mx-1' />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              title='Insert Link'
            >
              <Link className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-80'>
            <div className='space-y-3'>
              <div className='space-y-2'>
                <Label htmlFor='link-text'>Link Text</Label>
                <Input
                  id='link-text'
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder='Enter link text'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='link-url'>URL</Label>
                <Input
                  id='link-url'
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder='https://example.com'
                />
              </div>
              <Button 
                onClick={insertLink}
                disabled={!linkUrl || !linkText}
                size='sm'
              >
                Insert Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* WYSIWYG Editor */}
      <div className='relative'>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className='border rounded-b-lg p-4 min-h-[200px] bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 prose prose-sm max-w-none'
          style={{ minHeight: `${rows * 1.5}rem` }}
          suppressContentEditableWarning={true}
        />
        {value === '' && (
          <div className='absolute top-4 left-4 text-muted-foreground pointer-events-none'>
            {placeholder}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className='text-xs text-muted-foreground'>
        Type directly in the editor above. Use the toolbar buttons to format your text.
      </div>
    </div>
  );
};
