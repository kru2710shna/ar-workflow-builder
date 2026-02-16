import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface UploadZoneProps {
  onUpload: (fileName: string) => void;
}

const UploadZone = ({ onUpload }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file.name.replace(/\.pdf$/i, ""));
    },
    [onUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file.name.replace(/\.pdf$/i, ""));
    },
    [onUpload]
  );

  return (
    <motion.label
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/10 glow-primary"
          : "border-border hover:border-primary/50 bg-card/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div className="scan-line w-full h-full" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 p-8">
        <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
          {isDragging ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {isDragging ? "Drop your manual here" : "Upload PDF Manual"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            IKEA manuals, recipes, lab protocols — drag & drop or click
          </p>
        </div>
      </div>
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInput}
      />
    </motion.label>
  );
};

export default UploadZone;
