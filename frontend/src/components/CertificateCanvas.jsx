import React, { forwardRef } from 'react';
import { CheckCircle } from 'lucide-react';
import QRCode from "react-qr-code";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// The certificate artwork (1123x794, A4 landscape ratio). Shared by the learner's
// Certificate page and the admin Certificates registry so both always render
// the exact same document. The ref points at the element html2canvas captures.
const CertificateCanvas = forwardRef(({ name, courseTitle, completionDate, score, certId }, ref) => {
  const verificationUrl = `${window.location.origin}/verify/${certId}`;
  return (
      <div 
          ref={ref}
          className="bg-white relative flex"
          style={{ width: '1123px', height: '794px' }} 
      >
          {/* LEFT SIDEBAR */}
          <div className="w-24 h-full bg-black relative flex flex-col items-center py-12">
              <div className="w-full h-full absolute top-0 left-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>
              <div className="w-2 h-full bg-red-600 absolute right-0 top-0"></div>
              <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-600 font-bold tracking-[0.5em] text-xs -rotate-90 whitespace-nowrap uppercase opacity-50">
                      Verified Credential • AICourseHubPro
                  </p>
              </div>
          </div>
  
          {/* MAIN CONTENT */}
          <div className="flex-1 p-16 flex flex-col justify-between relative">
              
              {/* BACKGROUND WATERMARK (USING REAL LOGO) */}
              <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
                  <img src="/logo.png" alt="Watermark" className="w-96 h-96 grayscale" />
              </div>
  
              {/* Header */}
              <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-6">
                      {/* --- REAL LOGO HERE --- */}
                      <img src="/logo.png" alt="Logo" className="w-20 h-auto object-contain" />
                      
                      <div>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                              AICourseHub <span className="text-red-600">Pro</span>
                          </h2>
                          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">Professional Certification</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-gray-400 text-xs font-mono uppercase tracking-wide">Certificate ID</p>
                      <p className="text-gray-900 font-bold font-mono text-sm tracking-widest">{certId}</p>
                  </div>
              </div>
  
              {/* Body */}
              <div className="flex-1 flex flex-col justify-center z-10 mt-8">
                  <h1 className="text-6xl font-black text-gray-200 uppercase tracking-tight absolute top-[25%] left-16 select-none -z-10 opacity-20 scale-150 origin-top-left">
                      Achievement
                  </h1>
  
                  <p className="text-red-600 font-bold text-sm uppercase tracking-[0.3em] mb-4">Certificate of Completion</p>
                  <p className="text-gray-500 text-xl font-medium mb-6">This is to certify that</p>
                  
                  <h2 className="text-6xl font-black text-gray-900 tracking-tight mb-8">
                      {name}
                  </h2>
                  
                  <p className="text-gray-500 text-xl font-medium mb-4 max-w-2xl">
                      Has successfully completed the comprehensive course curriculum for
                  </p>
                  
                  <div className="border-l-4 border-red-600 pl-6 py-2 mb-8">
                      <h3 className="text-4xl font-bold text-gray-800 leading-tight">
                          {courseTitle}
                      </h3>
                  </div>
  
                  <div className="flex items-center gap-4">
                      <div className="bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600"/>
                          <span className="text-gray-700 font-bold text-sm">Score: {score}%</span>
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-md">
                          <span className="text-gray-700 font-bold text-sm">Issued: {completionDate}</span>
                      </div>
                  </div>
              </div>
  
              {/* Footer with QR */}
              <div className="flex justify-between items-end border-t border-gray-200 pt-8 z-10">
                  <div>
                      <div className="mb-2">
                          <p className="text-1xl text-gray-800 font-sans font-bold">Certifying Authority</p>
                      </div>
                      <p className="text-xs font-bold text-gray-400 tracking-wider">AICourseHubPro</p>
                  </div>
  
                  <div className="flex items-center gap-4">
                      <div className="text-right">
                          <p className="text-[10px] text-gray-400 font-mono leading-tight">
                              Scan to verify<br/>authenticity
                          </p>
                      </div>
                      <div className="bg-white p-1 border border-gray-200 rounded-lg">
                          {/* DYNAMIC QR CODE */}
                          <QRCode 
                              value={verificationUrl} 
                              size={64} 
                              fgColor="#000000" 
                              bgColor="#ffffff"
                          />
                      </div>
                  </div>
              </div>
  
          </div>
      </div>
  );
});

CertificateCanvas.displayName = 'CertificateCanvas';

// Renders the given certificate element to an A4 landscape PDF and downloads it.
export async function downloadCertificatePdf(element, fileBaseName) {
  const canvas = await html2canvas(element, { scale: 3, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  pdf.save(`Certificate_${String(fileBaseName || 'certificate').replace(/\s+/g, '_')}.pdf`);
}

export default CertificateCanvas;
