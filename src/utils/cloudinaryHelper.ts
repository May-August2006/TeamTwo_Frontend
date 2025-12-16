// utils/cloudinaryHelper.ts
export const cloudinaryHelper = {
  /**
   * Transform Cloudinary URL for download
   */
  getDownloadUrl: (cloudinaryUrl: string, fileName?: string): string => {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
      return cloudinaryUrl;
    }
    
    // Add fl_attachment parameter
    let downloadUrl = cloudinaryUrl;
    
    if (downloadUrl.includes('?')) {
      downloadUrl = downloadUrl + '&fl_attachment';
    } else {
      downloadUrl = downloadUrl + '?fl_attachment';
    }
    
    // Add filename if provided
    if (fileName) {
      const cleanName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');
      downloadUrl = downloadUrl + `:${cleanName}`;
    }
    
    return downloadUrl;
  },
  
  /**
   * Force download of Cloudinary file
   */
  downloadFile: (cloudinaryUrl: string, fileName?: string): void => {
    const downloadUrl = this.getDownloadUrl(cloudinaryUrl, fileName);
    
    // Create hidden iframe for better compatibility
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    // Also create a direct link
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = downloadUrl;
      if (fileName) {
        link.download = fileName;
      }
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 100);
    
    // Clean up iframe
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  }
};