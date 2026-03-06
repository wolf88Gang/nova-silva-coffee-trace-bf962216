import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface EvidenceFile {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface EvidenceUploaderProps {
  organizationId: string;
  planId: string;
  onFilesChange: (files: EvidenceFile[]) => void;
}

const BUCKET = 'nutrition-executions';
const MAX_FILES = 5;
const MAX_SIZE_MB = 10;

export default function EvidenceUploader({ organizationId, planId, onFilesChange }: EvidenceUploaderProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected?.length) return;

    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} archivos`);
      return;
    }

    setUploading(true);
    const newFiles: EvidenceFile[] = [];

    for (const file of Array.from(selected)) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} excede ${MAX_SIZE_MB}MB`);
        continue;
      }

      const now = new Date();
      const path = `${organizationId}/${planId}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Date.now()}-${file.name}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        toast.error(`Error subiendo ${file.name}: ${error.message}`);
        continue;
      }

      newFiles.push({ path, name: file.name, size: file.size, type: file.type });
    }

    const updated = [...files, ...newFiles];
    setFiles(updated);
    onFilesChange(updated);
    setUploading(false);

    if (inputRef.current) inputRef.current.value = '';
    if (newFiles.length) toast.success(`${newFiles.length} archivo(s) subido(s)`);
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          {uploading ? 'Subiendo…' : 'Adjuntar evidencia'}
        </Button>
        <span className="text-xs text-muted-foreground">{files.length}/{MAX_FILES}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleUpload}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <Badge key={f.path} variant="secondary" className="flex items-center gap-1 pr-1">
              <FileImage className="h-3 w-3" />
              <span className="max-w-[120px] truncate text-xs">{f.name}</span>
              <button type="button" onClick={() => removeFile(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
