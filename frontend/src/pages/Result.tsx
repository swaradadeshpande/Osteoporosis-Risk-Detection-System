import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  Activity,
  User,
  Calendar,
  ShieldCheck,
  Stethoscope,
  Info,
  Zap,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import api from '../lib/api';

const BACKEND = 'http://localhost:8000';

const Result: React.FC = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const [prediction, setPrediction] = useState<any>(location.state?.prediction);
  const [patient, setPatient] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const reportId = useRef(`OAI-${Math.floor(Math.random() * 1000000)}`);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${patientId}`);
        setPatient(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPatient();
  }, [patientId]);

  const getRiskInfo = (result: string) => {
    switch (result) {
      case 'Normal':
        return {
          colorHex: '#10b981',
          bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', borderClass: 'border-emerald-200',
          icon: CheckCircle,
          pdfColor: [16, 185, 129] as [number, number, number],
          pdfBg: [236, 253, 245] as [number, number, number],
        };
      case 'Osteopenia':
        return {
          colorHex: '#f59e0b',
          bgClass: 'bg-amber-50', textClass: 'text-amber-600', borderClass: 'border-amber-200',
          icon: AlertTriangle,
          pdfColor: [245, 158, 11] as [number, number, number],
          pdfBg: [255, 251, 235] as [number, number, number],
        };
      case 'Osteoporosis':
        return {
          colorHex: '#f43f5e',
          bgClass: 'bg-rose-50', textClass: 'text-rose-600', borderClass: 'border-rose-200',
          icon: AlertCircle,
          pdfColor: [244, 63, 94] as [number, number, number],
          pdfBg: [255, 241, 242] as [number, number, number],
        };
      default:
        return {
          colorHex: '#64748b',
          bgClass: 'bg-slate-50', textClass: 'text-slate-600', borderClass: 'border-slate-200',
          icon: AlertCircle,
          pdfColor: [100, 116, 139] as [number, number, number],
          pdfBg: [248, 250, 252] as [number, number, number],
        };
    }
  };

  const risk = getRiskInfo(prediction?.result);
  const allProbs = prediction?.allProbabilities || {};
  const gradcamSrc = prediction?.gradcamImage ? `${BACKEND}${prediction.gradcamImage}` : null;
  const xraySrc = prediction?.xrayImage ? `${BACKEND}${prediction.xrayImage}` : null;
  const confidence = ((prediction?.probability || 0) * 100).toFixed(1);

  // ── Download PDF — built with jsPDF directly, no html2canvas ─────────────
  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const margin = 16;
      const contentW = W - margin * 2;
      let y = 0;

      // Header bar
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, W, 28, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.text('OsteoAI', margin, 12);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
      pdf.text('MEDICAL DIAGNOSTIC REPORT', margin, 19);
      pdf.text(`Report ID: #${reportId.current}`, W - margin, 12, { align: 'right' });
      pdf.text(new Date().toLocaleString(), W - margin, 19, { align: 'right' });
      y = 36;

      // Patient info cards
      const cardW = (contentW - 8) / 3;
      [
        { label: 'PATIENT', line1: patient?.name || patientId || '—', line2: `${patient?.age || '—'} months · ${patient?.gender || '—'}` },
        { label: 'SCREENING DATE', line1: new Date(prediction?.timestamp).toLocaleDateString(), line2: 'X-ray AI Analysis' },
        { label: 'AI CONFIDENCE', line1: `${confidence}%`, line2: 'EfficientNetV2S + Fusion' },
      ].forEach((card, i) => {
        const cx = margin + i * (cardW + 4);
        pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(cx, y, cardW, 22, 3, 3, 'FD');
        pdf.setFontSize(7); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(148, 163, 184);
        pdf.text(card.label, cx + 4, y + 6);
        pdf.setFontSize(10); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
        pdf.text(card.line1.slice(0, 20), cx + 4, y + 13);
        pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100, 116, 139);
        pdf.text(card.line2, cx + 4, y + 19);
      });
      y += 30;

      // Risk result block
      pdf.setFillColor(...risk.pdfBg);
      pdf.setDrawColor(...risk.pdfColor); pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentW, 38, 4, 4, 'FD');
      pdf.setFontSize(22); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...risk.pdfColor);
      pdf.text(prediction?.result || '—', W / 2, y + 14, { align: 'center' });
      const riskDesc = `AI model detected structural patterns suggesting a ${(prediction?.result || '').toLowerCase()} risk level for osteoporosis.`;
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105);
      pdf.text(pdf.splitTextToSize(riskDesc, contentW - 20), W / 2, y + 22, { align: 'center' });
      // Bar
      const barX = margin + 30, barW2 = contentW - 60, barY = y + 33;
      pdf.setFillColor(226, 232, 240); pdf.roundedRect(barX, barY, barW2, 3, 1.5, 1.5, 'F');
      pdf.setFillColor(...risk.pdfColor); pdf.roundedRect(barX, barY, barW2 * (prediction?.probability || 0), 3, 1.5, 1.5, 'F');
      y += 46;

      // Class probabilities
      if (Object.keys(allProbs).length > 0) {
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
        pdf.text('Class Probabilities', margin, y); y += 6;
        const probColors: Record<string, [number,number,number]> = {
          Normal: [16, 185, 129], Osteopenia: [245, 158, 11], Osteoporosis: [244, 63, 94],
        };
        Object.entries(allProbs).forEach(([label, prob]: [string, any]) => {
          pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
          pdf.rect(margin, y, contentW, 10, 'FD');
          pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(51, 65, 85);
          pdf.text(label, margin + 3, y + 6.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`${(prob * 100).toFixed(1)}%`, W - margin - 3, y + 6.5, { align: 'right' });
          const bx = margin + 50, bw = contentW - 70;
          pdf.setFillColor(226, 232, 240); pdf.roundedRect(bx, y + 3, bw, 3.5, 1.5, 1.5, 'F');
          pdf.setFillColor(...(probColors[label] || [100, 116, 139]));
          pdf.roundedRect(bx, y + 3, bw * prob, 3.5, 1.5, 1.5, 'F');
          y += 12;
        });
        y += 4;
      }

      // Recommendation
      if (prediction?.recommendation) {
        pdf.setFillColor(239, 246, 255); pdf.setDrawColor(147, 197, 253);
        const recLines = pdf.splitTextToSize(prediction.recommendation, contentW - 16);
        const recH = 10 + recLines.length * 5;
        pdf.roundedRect(margin, y, contentW, recH, 3, 3, 'FD');
        pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(37, 99, 235);
        pdf.text('Recommendation:', margin + 4, y + 6);
        pdf.setFont('helvetica', 'normal'); pdf.setTextColor(30, 64, 175);
        pdf.text(recLines, margin + 4, y + 11);
        y += recH + 6;
      }

      // Clinical observations
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
      pdf.text('Clinical Observations', margin, y); y += 6;
      [
        'Bone structure patterns analyzed using EfficientNetV2S deep learning backbone.',
        'Tabular features (bone age, gender) fused with image features for accurate prediction.',
        'Grad-CAM heatmap generated to highlight attention regions in the X-ray.',
      ].forEach(line => {
        pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
        const lines = pdf.splitTextToSize(line, contentW - 14);
        const h = 6 + lines.length * 4.5;
        pdf.roundedRect(margin, y, contentW, h, 2, 2, 'FD');
        pdf.setFillColor(37, 99, 235); pdf.circle(margin + 4, y + h / 2, 1, 'F');
        pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105);
        pdf.text(lines, margin + 8, y + 5);
        y += h + 3;
      });
      y += 4;

      // Grad-CAM / X-ray image
      const imgSrc = gradcamSrc || xraySrc;
      if (imgSrc) {
        if (y + 70 > 270) { pdf.addPage(); y = 16; }
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
        pdf.text(gradcamSrc ? 'AI Heatmap Analysis (Grad-CAM)' : 'Uploaded X-ray Image', margin, y);
        y += 5;
        try {
          const resp = await fetch(imgSrc, { mode: 'cors' });
          const blob = await resp.blob();
          const base64 = await new Promise<string>((res2) => {
            const fr = new FileReader();
            fr.onload = () => res2(fr.result as string);
            fr.readAsDataURL(blob);
          });
          const imgType = blob.type.includes('png') ? 'PNG' : 'JPEG';
          const ih = 60, iw = (ih * 4) / 3;
          pdf.addImage(base64, imgType, W / 2 - iw / 2, y, iw, ih);
          y += ih + 4;
          if (gradcamSrc) {
            pdf.setFontSize(7.5); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(148, 163, 184);
            pdf.text('Red/yellow regions indicate highest model attention areas', W / 2, y, { align: 'center' });
            y += 6;
          }
        } catch {
          pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
          pdf.text('[Image could not be embedded — view online]', W / 2, y + 10, { align: 'center' });
          y += 20;
        }
      }

      // Disclaimer
      if (y + 22 > 277) { pdf.addPage(); y = 16; }
      const disLines = pdf.splitTextToSize(
        'This report is generated by an AI system and should be used as a screening tool only. Final diagnosis must be confirmed by a qualified radiologist or physician.',
        contentW - 20
      );
      pdf.setFillColor(15, 23, 42);
      pdf.roundedRect(margin, y, contentW, 10 + disLines.length * 5, 3, 3, 'F');
      pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(96, 165, 250);
      pdf.text('Medical Disclaimer', margin + 5, y + 7);
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
      pdf.text(disLines, margin + 5, y + 13);

      // Footer
      pdf.setFontSize(7); pdf.setTextColor(148, 163, 184);
      pdf.text('Generated by OsteoAI — Osteoporosis Risk Prediction System', W / 2, 290, { align: 'center' });

      pdf.save(`OsteoAI_Report_${patientId}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Use the Print button instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Print with color-accurate styles ─────────────────────────────────────
  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = '__osteoai_print__';
    style.innerHTML = `
      @media print {
        body > * { display: none !important; }
        #osteoai-report-wrap { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; background: white; padding: 20px; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      }
    `;
    document.head.appendChild(style);

    // Wrap report and move to top of body temporarily
    const wrap = document.createElement('div');
    wrap.id = 'osteoai-report-wrap';
    const clone = reportRef.current?.cloneNode(true) as HTMLElement;
    if (clone) {
      wrap.appendChild(clone);
      document.body.appendChild(wrap);
    }

    window.print();

    setTimeout(() => {
      document.getElementById('__osteoai_print__')?.remove();
      document.getElementById('osteoai-report-wrap')?.remove();
    }, 1500);
  };

  return (
    <div className="p-6 md:p-10 pt-24 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto">

        {/* Action bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Screening Result</h2>
            <p className="text-slate-500">Comprehensive AI analysis for Patient {patientId}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="w-5 h-5 mr-2" />
              Print
            </button>
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
            >
              <Download className="w-5 h-5 mr-2" />
              {pdfLoading ? 'Generating...' : 'Download PDF'}
            </button>
            <Link
              to="/chatbot"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Consult AI
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Report */}
        <div id="osteoai-report" ref={reportRef} className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 mb-12">

          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-8 border-b border-slate-100">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2.5 rounded-xl mr-4">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">OsteoAI</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Diagnostic Report</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">Report ID: #{reportId.current}</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Patient cards */}
          <div className="grid grid-cols-3 gap-5 mb-10">
            {[
              { icon: User, label: 'Patient', line1: patient?.name || 'Loading...', line2: `${patient?.age || '—'} months · ${patient?.gender || '—'}` },
              { icon: Calendar, label: 'Date', line1: new Date(prediction?.timestamp).toLocaleDateString(), line2: 'X-ray AI Analysis' },
              { icon: ShieldCheck, label: 'Confidence', line1: `${confidence}%`, line2: 'EfficientNetV2S + Fusion' },
            ].map(({ icon: Icon, label, line1, line2 }) => (
              <div key={label} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center text-slate-400 mb-2">
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
                </div>
                <p className="text-base font-black text-slate-900">{line1}</p>
                <p className="text-xs text-slate-500">{line2}</p>
              </div>
            ))}
          </div>

          {/* Risk result */}
          <div
            className={`p-8 rounded-[2rem] border-2 flex flex-col items-center text-center mb-10 ${risk.bgClass} ${risk.borderClass}`}
          >
            <div className="p-4 rounded-2xl bg-white shadow-sm mb-5 inline-flex">
              <risk.icon className="w-14 h-14" style={{ color: risk.colorHex }} />
            </div>
            <h3 className="text-5xl font-black mb-3" style={{ color: risk.colorHex }}>
              {prediction?.result}
            </h3>
            <p className="text-slate-600 max-w-lg">
              AI model detected patterns suggesting a <strong>{prediction?.result?.toLowerCase()}</strong> risk level for osteoporosis.
            </p>
            <div className="w-full max-w-md mt-6 bg-white/60 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(prediction?.probability || 0) * 100}%`, backgroundColor: risk.colorHex }}
              />
            </div>
          </div>

          {/* Class probabilities */}
          {Object.keys(allProbs).length > 0 && (
            <div className="mb-10 p-7 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-lg font-black text-slate-900 mb-5 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Class Probabilities
              </h4>
              <div className="space-y-4">
                {Object.entries(allProbs).map(([label, prob]: [string, any]) => {
                  const c = label === 'Normal' ? '#10b981' : label === 'Osteopenia' ? '#f59e0b' : '#f43f5e';
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm font-bold mb-1.5">
                        <span className="text-slate-700">{label}</span>
                        <span className="text-slate-900">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${prob * 100}%`, backgroundColor: c }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clinical + Grad-CAM */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-4">
              <h4 className="text-lg font-black text-slate-900 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                Clinical Observations
              </h4>
              {[
                'Bone structure patterns analyzed using EfficientNetV2S deep learning backbone.',
                'Tabular features (bone age, gender) fused with image features for accurate prediction.',
              ].map((obs, i) => (
                <div key={i} className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 mr-3 shrink-0" />
                  <p className="text-sm text-slate-600">{obs}</p>
                </div>
              ))}
              {prediction?.recommendation && (
                <div className="flex items-start p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 mr-3 shrink-0" />
                  <p className="text-sm text-blue-800 font-medium">{prediction.recommendation}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                AI Heatmap (Grad-CAM)
              </h4>
              <div className="rounded-2xl overflow-hidden border-2 border-slate-200 aspect-[4/3] bg-slate-100 relative">
                {(gradcamSrc || xraySrc) ? (
                  <img
                    src={gradcamSrc || xraySrc!}
                    alt={gradcamSrc ? 'Grad-CAM heatmap' : 'X-ray image'}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                    <Zap className="w-10 h-10 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Grad-CAM Visualization</p>
                  </div>
                )}
              </div>
              {gradcamSrc && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Red/yellow = highest model attention areas
                </p>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-7 bg-slate-900 rounded-2xl text-white flex items-start gap-5">
            <Info className="w-8 h-8 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-base mb-1">Medical Disclaimer</h5>
              <p className="text-slate-400 text-sm leading-relaxed">
                This report is generated by an AI system and should be used as a screening tool only.
                Final diagnosis must be confirmed by a qualified radiologist or physician.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
