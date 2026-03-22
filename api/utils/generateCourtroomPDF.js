import PDFDocument from 'pdfkit';

export function generateCourtroomPDF(caseData) {
  return new Promise((resolve, reject) => {
    if (!caseData) {
      return reject(new Error('No case data provided'));
    }

    const {
      parsedDenial,
      agents,
      rebuttals,
      overrideResult,
      concededAgents = []
    } = caseData;

    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // Helper functions
    const addTitle = (text) => {
      doc.fontSize(16).font('Helvetica-Bold').text(text, { align: 'center' });
      doc.moveDown(0.5);
    };

    const addSectionHeader = (text) => {
      doc.fontSize(12).font('Helvetica-Bold').text(text);
      doc.moveDown(0.3);
    };

    const addText = (text, options = {}) => {
      doc.fontSize(10).font('Helvetica').text(text, options);
    };

    const addBullet = (text) => {
      doc.fontSize(10).font('Helvetica').text(`• ${text}`, { indent: 20 });
    };

    const addLine = () => {
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);
    };

    // Title
    addTitle('AI COURTROOM SUMMARY');
    addText('VerdictX Adversarial Analysis', { align: 'center' });
    doc.moveDown(1);
    addLine();

    // Case Overview
    addSectionHeader('CASE OVERVIEW');
    if (parsedDenial) {
      addText(`Institution: ${parsedDenial.institution_name || parsedDenial.institution || 'Not specified'}`);
      addText(`Denial Type: ${parsedDenial.denial_type || parsedDenial.application_type || 'Not specified'}`);
      
      if (parsedDenial.stated_reasons && parsedDenial.stated_reasons.length > 0) {
        doc.moveDown(0.3);
        addText('Key Denial Reasons:');
        parsedDenial.stated_reasons.forEach((reason, i) => {
          addBullet(`${reason}`);
        });
      } else if (parsedDenial.primary_reason) {
        addText(`Primary Reason: ${parsedDenial.primary_reason}`);
        if (parsedDenial.secondary_reason && parsedDenial.secondary_reason !== 'Not specified') {
          addText(`Secondary Reason: ${parsedDenial.secondary_reason}`);
        }
      }

      if (parsedDenial.applicant_name) {
        addText(`Applicant: ${parsedDenial.applicant_name}`);
      }
      if (parsedDenial.denial_date) {
        addText(`Denial Date: ${parsedDenial.denial_date}`);
      }
    } else {
      addText('Case details not available');
    }
    doc.moveDown(1);
    addLine();

    // Agent Arguments
    addSectionHeader('AGENT ARGUMENTS');
    addText('VerdictX deployed 6 AI agents in an adversarial courtroom simulation:');
    doc.moveDown(0.5);

    const agentInfo = [
      { id: 'bias_auditor', name: 'Bias Auditor', role: 'Discrimination & fairness analysis' },
      { id: 'precedent_agent', name: 'Precedent Agent', role: 'Legal precedent research' },
      { id: 'circumstance_agent', name: 'Circumstance Agent', role: 'Individual circumstances & context' },
      { id: 'legal_agent', name: 'Legal Agent', role: 'Regulatory compliance review' },
      { id: 'denial_defender', name: 'Denial Defender', role: 'Institution\'s defense' },
    ];

    agentInfo.forEach(({ id, name, role }) => {
      const agent = agents?.[id];
      const rebuttal = rebuttals?.[id];
      const wasConceded = concededAgents.includes(id);

      doc.fontSize(11).font('Helvetica-Bold').text(`${name}`, { continued: true });
      doc.fontSize(9).font('Helvetica').text(` (${role})`);
      
      if (agent?.content) {
        const preview = agent.content.split('\n').slice(0, 3).join(' ').substring(0, 400);
        doc.fontSize(9).font('Helvetica').text(preview + (agent.content.length > 400 ? '...' : ''), { 
          indent: 20,
          align: 'justify'
        });
      } else {
        addText('No argument available', { indent: 20 });
      }

      if (rebuttal?.result) {
        doc.fontSize(9).font('Helvetica-Oblique').text(`→ Defense Response: ${rebuttal.result}`, { indent: 20 });
      }

      if (wasConceded) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('red')
          .text('✗ CONCEDED — Defense could not rebut this argument', { indent: 20 });
        doc.fillColor('black');
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(0.5);
    addLine();

    // Defense Position
    addSectionHeader('DEFENSE POSITION');
    const defender = agents?.denial_defender;
    if (defender?.content) {
      const defensePreview = defender.content.split('\n').slice(0, 5).join(' ').substring(0, 600);
      addText(defensePreview + (defender.content.length > 600 ? '...' : ''), { align: 'justify' });
    } else {
      addText('Defense arguments not available');
    }
    doc.moveDown(1);
    addLine();

    // Judge's Analysis
    addSectionHeader('JUDGE\'S ANALYSIS');
    const judge = overrideResult?.judgeOutput;
    if (judge) {
      if (judge.overall_assessment) {
        addText(`Assessment: ${judge.overall_assessment}`, { align: 'justify' });
        doc.moveDown(0.3);
      }
      if (judge.reasoning) {
        addText(`Reasoning: ${judge.reasoning}`, { align: 'justify' });
        doc.moveDown(0.3);
      }
      if (judge.analysis) {
        addText(judge.analysis, { align: 'justify' });
        doc.moveDown(0.3);
      }
      if (judge.summary) {
        addText(judge.summary, { align: 'justify' });
        doc.moveDown(0.3);
      }

      if (judge.strongest_arguments && Array.isArray(judge.strongest_arguments)) {
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text('Strongest Arguments:');
        judge.strongest_arguments.forEach((arg, i) => {
          const text = typeof arg === 'string' ? arg : (arg.argument || arg.text || JSON.stringify(arg));
          addBullet(text);
        });
      }

      if (judge.conceded_arguments && Array.isArray(judge.conceded_arguments)) {
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text('Conceded Points:');
        judge.conceded_arguments.forEach((arg) => {
          addBullet(arg);
        });
      }
    } else {
      addText('Judge analysis not available');
    }
    doc.moveDown(1);
    addLine();

    // Final Outcome
    addSectionHeader('FINAL OUTCOME');
    const triggered = overrideResult?.triggered;
    const concessionCount = overrideResult?.concessions || 0;

    if (triggered) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('green')
        .text(`✓ VerdictX ACTIVATED in favor of the applicant`);
      doc.fillColor('black').fontSize(10).font('Helvetica')
        .text(`✓ ${concessionCount} of 4 challenges were conceded by the defense`);
      
      doc.moveDown(0.5);
      addText('Conceded Arguments:');
      concededAgents.forEach(agentId => {
        const agentName = agentInfo.find(a => a.id === agentId)?.name || agentId;
        addBullet(agentName);
      });
      
      doc.moveDown(0.5);
      addText('Why This Outcome:', { underline: true });
      addText('The institution\'s defense collapsed on multiple fronts. When 2 or more challenges cannot be rebutted, VerdictX determines there is sufficient evidence to warrant a formal appeal and human review.', { align: 'justify' });
    } else {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('red')
        .text(`✗ VerdictX did not activate`);
      doc.fillColor('black').fontSize(10).font('Helvetica')
        .text(`✗ Only ${concessionCount} of 4 challenges were conceded (threshold: 2)`);
      
      doc.moveDown(0.5);
      addText('The defense successfully rebutted enough arguments to avoid triggering the automatic appeal threshold.', { align: 'justify' });
    }
    doc.moveDown(1);
    addLine();

    // Recommended Lawyer Focus
    addSectionHeader('RECOMMENDED LAWYER FOCUS');
    if (triggered && concededAgents.length > 0) {
      addText('The following areas represent the strongest grounds for appeal:');
      doc.moveDown(0.5);
      
      concededAgents.forEach(agentId => {
        const agentName = agentInfo.find(a => a.id === agentId)?.name || agentId;
        const agent = agents?.[agentId];
        
        doc.fontSize(10).font('Helvetica-Bold').text(`${agentName}:`);
        
        if (agent?.data?.strongest_argument) {
          addText(agent.data.strongest_argument, { indent: 20, align: 'justify' });
        } else if (agent?.data?.strongest_violation) {
          addText(agent.data.strongest_violation, { indent: 20, align: 'justify' });
        } else if (agent?.data?.strongest_precedent) {
          addText(agent.data.strongest_precedent, { indent: 20, align: 'justify' });
        } else if (agent?.content) {
          const keyLine = agent.content.split('\n').find(line => 
            line.includes('KEY') || line.includes('STRONGEST') || line.includes('ARGUMENT')
          );
          if (keyLine) {
            addText(keyLine.trim(), { indent: 20, align: 'justify' });
          } else {
            addText('Review the full argument details above', { indent: 20 });
          }
        }
        doc.moveDown(0.3);
      });
    } else {
      addText('While VerdictX did not activate, a lawyer may still find value in reviewing the AI analysis for potential manual appeal strategies.', { align: 'justify' });
    }

    // Footer
    doc.moveDown(2);
    addLine();
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('gray')
      .text('Generated by VerdictX — AI-Powered Legal Analysis Platform', { align: 'center' });
    doc.text(`Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.end();
  });
}
