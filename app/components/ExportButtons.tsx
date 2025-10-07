"use client";

import { Download, FileText, Music } from "lucide-react";
import jsPDF from "jspdf";

interface ExportButtonsProps {
  storyText: string;
  audioUrl: string;
  storyTitle?: string;
}

export default function ExportButtons({ storyText, audioUrl, storyTitle }: ExportButtonsProps) {
  // Download story as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - 2 * margin;
    
    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const title = storyTitle || "My Story";
    doc.text(title, margin, margin);
    
    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const date = new Date().toLocaleDateString();
    doc.text(`Generated on: ${date}`, margin, margin + 10);
    
    // Story content
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(storyText, maxLineWidth);
    
    let yPosition = margin + 25;
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });
    
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }
    
    doc.save(`${title.replace(/\s+/g, '_')}_story.pdf`);
  };

  // Download story as TXT
  const downloadTXT = () => {
    const title = storyTitle || "My Story";
    const content = `${title}\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n${storyText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_story.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download audio
  const downloadAudio = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(storyTitle || "story").replace(/\s+/g, '_')}_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading audio:", error);
      alert("Failed to download audio. Please try again.");
    }
  };

  if (!storyText) return null;

  return (
    <div className="mb-6 p-5 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 animate-fade-in">
      <p className="text-xs text-purple-400 mb-3 font-semibold uppercase tracking-wider">
        Export Options
      </p>
      <div className="flex flex-wrap gap-3">
        {/* PDF Download */}
        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 font-medium transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>Download PDF</span>
        </button>

        {/* TXT Download */}
        <button
          onClick={downloadTXT}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download TXT</span>
        </button>

        {/* Audio Download */}
        {audioUrl && (
          <button
            onClick={downloadAudio}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 font-medium transition-all"
          >
            <Music className="w-4 h-4" />
            <span>Download Audio</span>
          </button>
        )}
      </div>
    </div>
  );
}
