import { useState } from "react";
import { Upload, FileCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  description: string;
  isUploaded: boolean;
  onUpload: () => void;
  onRemove: () => void;
}

export function FileUpload({ label, description, isUploaded, onUpload, onRemove }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {isUploaded && <span className="text-xs text-primary font-mono flex items-center gap-1"><FileCheck className="w-3 h-3" /> UPLOADED</span>}
      </div>
      
      {!isUploaded ? (
        <div
          onClick={onUpload}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); onUpload(); }}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group h-32",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="bg-muted p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium group-hover:text-foreground">{description}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">PDF or Image (Max 10MB)</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-md flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{label}.pdf</p>
              <p className="text-xs text-muted-foreground">Uploaded just now</p>
            </div>
          </div>
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
