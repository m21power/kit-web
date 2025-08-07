import React from 'react';
import { FileSystemItem } from '../types';
import { File } from 'lucide-react';

interface CodeEditorProps {
  activeFile: FileSystemItem | null;
  onContentChange: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, onContentChange }) => {
  if (!activeFile) {
    return (
      <div className="h-full bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center text-[#969696]">
          <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No file selected</p>
          <p className="text-sm">Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      {/* File Tab */}
      <div className="flex items-center bg-[#2d2d30] border-b border-[#3c3c3c]">
        <div className="flex items-center px-4 py-2 bg-[#1e1e1e] border-r border-[#3c3c3c]">
          <File className="w-4 h-4 mr-2 text-[#519aba]" />
          <span className="text-sm text-[#cccccc]">{activeFile.name}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={activeFile.content || ''}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full h-full bg-transparent text-[#cccccc] font-mono text-sm resize-none focus:outline-none"
          placeholder="Start typing..."
          style={{
            lineHeight: '1.6',
            tabSize: 2
          }}
        />
      </div>
    </div>
  );
};