import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recentDocuments } = useQuery({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
        description: "AI processing has begun. You'll be notified when complete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word, and Excel files are allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleChooseFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (e) => handleFileInput(e as any);
    input.click();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return 'fas fa-file-pdf';
    if (mimeType.includes('word')) return 'fas fa-file-word';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'fas fa-file-excel';
    return 'fas fa-file';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold mb-2">Contract Document Upload</h3>
        <p className="text-sm text-muted-foreground">
          Upload PDF, Word, or Excel contract files for AI-powered data extraction
        </p>
      </div>
      <div className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          data-testid="drop-zone-upload"
        >
          <div className="space-y-4">
            <div className="bg-primary/10 text-primary rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <i className="fas fa-cloud-upload-alt text-2xl"></i>
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, DOC, DOCX, XLS, XLSX up to 10MB
              </p>
            </div>
            <button
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleChooseFiles}
              disabled={uploadMutation.isPending}
              data-testid="button-choose-files"
            >
              {uploadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                "Choose Files"
              )}
            </button>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Recent Uploads</h4>
          <div className="space-y-2">
            {recentDocuments && recentDocuments.length > 0 ? (
              recentDocuments.slice(0, 3).map((upload: any) => (
                <div
                  key={upload.id}
                  className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                  data-testid={`upload-item-${upload.id}`}
                >
                  <div className="bg-primary text-primary-foreground rounded p-2">
                    <i className={getFileIcon(upload.mimeType)}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-filename-${upload.id}`}>
                      {upload.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-upload-time-${upload.id}`}>
                      {formatTimeAgo(upload.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        upload.processingStatus === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : upload.processingStatus === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                      data-testid={`status-${upload.id}`}
                    >
                      {upload.processingStatus}
                    </span>
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`button-view-${upload.id}`}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
