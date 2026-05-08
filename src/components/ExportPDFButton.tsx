'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';

interface Employee {
  name: string;
  agentId: string;
  weeklyHours: number;
  estimatedHours: number;
  totalTokens: number;
  weeklyTokens: number;
  tokensIn: number;
  tokensOut: number;
  totalCost: number;
  weeklyCost: number;
  streak: number;
  rank: number;
  lastActive: string;
  sessionCount: number;
}

interface Props {
  employees: Employee[];
  viewMode: 'weekly' | 'total';
}

function getBadge(hours: number): string {
  if (hours >= 20) return 'Pioneer';
  if (hours >= 15) return 'Voltage';
  if (hours >= 10) return 'Sniper';
  if (hours >= 5) return 'Diamond';
  return 'Flame';
}

function getBadgeColor(hours: number): [number, number, number] {
  if (hours >= 20) return [168, 85, 247];   // purple
  if (hours >= 15) return [59, 130, 246];    // blue
  if (hours >= 10) return [34, 197, 94];     // green
  if (hours >= 5) return [234, 179, 8];      // yellow
  return [156, 163, 175];                     // grey
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function ExportPDFButton({ employees, viewMode }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const isWeekly = viewMode === 'weekly';
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Calcutta' });

      const totalEmp = employees.length;
      const totalHrs = isWeekly
        ? employees.reduce((a, e) => a + e.weeklyHours, 0)
        : employees.reduce((a, e) => a + e.estimatedHours, 0);
      const goalMet = employees.filter(e => e.weeklyHours >= 10).length;
      const totalCost = isWeekly
        ? employees.reduce((a, e) => a + e.weeklyCost, 0)
        : employees.reduce((a, e) => a + e.totalCost, 0);
      const savedVsChatGPT = Math.max(0, (totalEmp * 30) - totalCost);

      const sorted = isWeekly
        ? [...employees].sort((a, b) => b.weeklyHours - a.weeklyHours)
        : [...employees].sort((a, b) => b.estimatedHours - a.estimatedHours);

      // ══════════════════════════════════════
      // PAGE 1: COVER + SUMMARY
      // ══════════════════════════════════════

      // Dark header block
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 0, pageW, 60, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('Livio AI Dashboard', pageW / 2, 28, { align: 'center' });

      // Subtitle
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(196, 181, 253);
      doc.text(`HR Analytics Report  |  ${isWeekly ? 'Weekly' : 'All Time'}`, pageW / 2, 40, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setTextColor(148, 140, 190);
      doc.text(`Generated: ${now} IST`, pageW / 2, 50, { align: 'center' });

      // Summary section
      let y = 72;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 27, 75);
      doc.text('Summary', 20, y);

      y += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 80);

      const summaryLines = [
        `${totalEmp} employees active on OpenClaw`,
        `${totalHrs.toFixed(1)} ${isWeekly ? 'weekly' : 'total'} hours logged`,
        `${goalMet} out of ${totalEmp} employees hit the 10-hour goal`,
        `$${totalCost.toFixed(2)} total cost  |  $${savedVsChatGPT.toFixed(2)} saved vs ChatGPT Team ($30/user/mo)`,
      ];

      summaryLines.forEach(line => {
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(20, y - 5, pageW - 40, 10, 2, 2, 'F');
        doc.setTextColor(60, 60, 80);
        doc.text(line, 25, y + 1.5);
        y += 14;
      });

      // Goal overview
      y += 6;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 27, 75);
      doc.text('Goal Overview', 20, y);

      y += 10;
      const goalPct = totalEmp > 0 ? Math.round((goalMet / totalEmp) * 100) : 0;

      // Progress bar background
      doc.setFillColor(230, 230, 240);
      doc.roundedRect(20, y, pageW - 40, 8, 4, 4, 'F');

      // Progress bar fill
      const barW = (pageW - 40) * (goalPct / 100);
      if (barW > 0) {
        doc.setFillColor(168, 85, 247);
        doc.roundedRect(20, y, Math.max(barW, 4), 8, 4, 4, 'F');
      }

      // Percentage text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${goalPct}%`, 20 + barW / 2, y + 5.5, { align: 'center' });

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 120);
      doc.setFontSize(10);
      doc.text(`${goalMet} of ${totalEmp} employees reached the 10-hour weekly goal`, 20, y);

      // ══════════════════════════════════════
      // PAGE 2: TOP PERFORMERS
      // ══════════════════════════════════════
      doc.addPage();

      y = 20;
      doc.setFillColor(30, 27, 75);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.rect(0, 0, pageW, 30, 'F');
      doc.text('Top Performers', pageW / 2, 18, { align: 'center' });

      y = 40;
      const top10 = sorted.slice(0, 10);

      top10.forEach((emp, idx) => {
        const hours = isWeekly ? emp.weeklyHours : emp.estimatedHours;
        const tokens = isWeekly ? emp.weeklyTokens : emp.totalTokens;
        const cost = isWeekly ? emp.weeklyCost : emp.totalCost;
        const badge = getBadge(hours);
        const color = getBadgeColor(hours);
        const goalStatus = hours >= 10 ? 'Goal Met' : 'Below Goal';

        // Rank number circle
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(28, y + 3, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(String(idx + 1), 28, y + 5.5, { align: 'center' });

        // Name
        doc.setTextColor(30, 27, 75);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(emp.name, 38, y + 2);

        // Badge tag
        const badgeX = 38 + doc.getTextWidth(emp.name) + 4;
        doc.setFillColor(color[0], color[1], color[2]);
        const badgeW = doc.getTextWidth(badge) + 8;
        doc.roundedRect(badgeX, y - 3, badgeW, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(badge, badgeX + 4, y + 1.5);

        // Stats line
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 120);
        doc.text(`${hours.toFixed(1)} hrs  |  ${fmtTokens(tokens)} tokens  |  $${cost.toFixed(2)}  |  ${goalStatus}`, 38, y + 10);

        // Separator
        if (idx < top10.length - 1) {
          doc.setDrawColor(230, 230, 240);
          doc.setLineWidth(0.3);
          doc.line(38, y + 15, pageW - 20, y + 15);
        }

        y += 22;
      });

      // ══════════════════════════════════════
      // PAGE 3: ALL EMPLOYEES
      // ══════════════════════════════════════
      doc.addPage();

      y = 20;
      doc.setFillColor(30, 27, 75);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.rect(0, 0, pageW, 30, 'F');
      doc.text('All Employees', pageW / 2, 18, { align: 'center' });

      y = 40;

      // Two-column layout
      const colW = (pageW - 40) / 2;
      const leftX = 20;
      const rightX = 20 + colW + 10;

      sorted.forEach((emp, idx) => {
        const hours = isWeekly ? emp.weeklyHours : emp.estimatedHours;
        const col = idx % 2 === 0 ? leftX : rightX;
        const row = Math.floor(idx / 2);

        // Recalculate y based on row
        const rowY = 40 + row * 12;

        // If we'd go off page, add new page
        if (rowY > 270 && col === leftX) {
          doc.addPage();
          y = 20;
          doc.setFillColor(30, 27, 75);
          doc.rect(0, 0, pageW, 30, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('All Employees (continued)', pageW / 2, 18, { align: 'center' });
        }

        const actualY = rowY > 270 ? 40 + (row - Math.floor((270 - 40) / 12)) * 12 : rowY;

        // Name
        doc.setTextColor(30, 27, 75);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(emp.name, col, actualY);

        // Hours
        const nameW = doc.getTextWidth(emp.name);
        const hoursColor = hours >= 10 ? [34, 197, 94] : [156, 163, 175];
        doc.setTextColor(hoursColor[0], hoursColor[1], hoursColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${hours.toFixed(1)} hrs`, col + nameW + 4, actualY);
      });

      // ══════════════════════════════════════
      // FOOTER on every page
      // ══════════════════════════════════════
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(30, 27, 75);
        doc.rect(0, pageH - 8, pageW, 8, 'F');
        doc.setFontSize(7);
        doc.setTextColor(196, 181, 253);
        doc.text('Livio AI  |  Confidential', 20, pageH - 3);
        doc.text(`Page ${i} of ${totalPages}  |  ${now}`, pageW - 20, pageH - 3, { align: 'right' });
      }

      // Save
      const filename = `livio-hr-report-${isWeekly ? 'weekly' : 'alltime'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl transition-colors text-sm shadow-lg shadow-cyan-500/20"
    >
      {exporting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </>
      ) : (
        <>Export to PDF</>
      )}
    </button>
  );
}
