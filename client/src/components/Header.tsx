export function Header() {
  const handleUploadContract = () => {
    // This would trigger the file upload dialog
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx';
    fileInput.click();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-page-title">
            Dashboard
          </h2>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Welcome back, manage your contracts and track compliance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            className="relative p-2 text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            onClick={handleUploadContract}
            data-testid="button-upload-contract"
          >
            <i className="fas fa-plus mr-2"></i>
            Upload Contract
          </button>
        </div>
      </div>
    </header>
  );
}
