export function buildCourtroomSummary(caseData) {
  if (!caseData) return null;

  const {
    parsedDenial,
    agents,
    rebuttals,
    overrideResult,
    concededAgents = []
  } = caseData;

  const sections = [];

  sections.push('═══════════════════════════════════════════════════════════════════════════');
  sections.push('AI COURTROOM SUMMARY — VerdictX Adversarial Analysis');
  sections.push('═══════════════════════════════════════════════════════════════════════════');
  sections.push('');

  sections.push('CASE OVERVIEW');
  sections.push('─────────────');
  if (parsedDenial) {
    sections.push(`Institution: ${parsedDenial.institution_name || parsedDenial.institution || 'Not specified'}`);
    sections.push(`Denial Type: ${parsedDenial.denial_type || parsedDenial.application_type || 'Not specified'}`);
    
    if (parsedDenial.stated_reasons && parsedDenial.stated_reasons.length > 0) {
      sections.push('Key Denial Reasons:');
      parsedDenial.stated_reasons.forEach((reason, i) => {
        sections.push(`  ${i + 1}. ${reason}`);
      });
    } else if (parsedDenial.primary_reason) {
      sections.push(`Primary Reason: ${parsedDenial.primary_reason}`);
      if (parsedDenial.secondary_reason && parsedDenial.secondary_reason !== 'Not specified') {
        sections.push(`Secondary Reason: ${parsedDenial.secondary_reason}`);
      }
    }

    if (parsedDenial.applicant_name) {
      sections.push(`Applicant: ${parsedDenial.applicant_name}`);
    }
    if (parsedDenial.denial_date) {
      sections.push(`Denial Date: ${parsedDenial.denial_date}`);
    }
  } else {
    sections.push('Case details not available');
  }
  sections.push('');

  sections.push('AGENT ARGUMENTS');
  sections.push('───────────────');
  sections.push('VerdictX deployed 6 AI agents in an adversarial courtroom simulation:');
  sections.push('');

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

    sections.push(`${name} (${role}):`);
    
    if (agent?.content) {
      const preview = agent.content.split('\n').slice(0, 3).join('\n').substring(0, 300);
      sections.push(`  ${preview}${agent.content.length > 300 ? '...' : ''}`);
    } else {
      sections.push('  No argument available');
    }

    if (rebuttal?.result) {
      sections.push(`  → Defense Response: ${rebuttal.result}`);
    }

    if (wasConceded) {
      sections.push('  ✗ CONCEDED — Defense could not rebut this argument');
    }

    sections.push('');
  });

  sections.push('DEFENSE POSITION');
  sections.push('────────────────');
  const defender = agents?.denial_defender;
  if (defender?.content) {
    const defensePreview = defender.content.split('\n').slice(0, 4).join('\n').substring(0, 400);
    sections.push(`${defensePreview}${defender.content.length > 400 ? '...' : ''}`);
  } else {
    sections.push('Defense arguments not available');
  }
  sections.push('');

  sections.push('JUDGE\'S ANALYSIS');
  sections.push('────────────────');
  const judge = overrideResult?.judgeOutput;
  if (judge) {
    if (judge.overall_assessment) {
      sections.push(`Assessment: ${judge.overall_assessment}`);
    }
    if (judge.reasoning) {
      sections.push(`Reasoning: ${judge.reasoning}`);
    }
    if (judge.analysis) {
      sections.push(`${judge.analysis}`);
    }
    if (judge.summary) {
      sections.push(`${judge.summary}`);
    }

    if (judge.strongest_arguments && Array.isArray(judge.strongest_arguments)) {
      sections.push('');
      sections.push('Strongest Arguments:');
      judge.strongest_arguments.forEach((arg, i) => {
        const text = typeof arg === 'string' ? arg : (arg.argument || arg.text || JSON.stringify(arg));
        sections.push(`  ${i + 1}. ${text}`);
      });
    }

    if (judge.conceded_arguments && Array.isArray(judge.conceded_arguments)) {
      sections.push('');
      sections.push('Conceded Points:');
      judge.conceded_arguments.forEach((arg, i) => {
        sections.push(`  ${i + 1}. ${arg}`);
      });
    }
  } else {
    sections.push('Judge analysis not available');
  }
  sections.push('');

  sections.push('FINAL OUTCOME');
  sections.push('─────────────');
  const triggered = overrideResult?.triggered;
  const concessionCount = overrideResult?.concessions || 0;

  if (triggered) {
    sections.push(`✓ VerdictX ACTIVATED in favor of the applicant`);
    sections.push(`✓ ${concessionCount} of 4 challenges were conceded by the defense`);
    sections.push('');
    sections.push('Conceded Arguments:');
    concededAgents.forEach(agentId => {
      const agentName = agentInfo.find(a => a.id === agentId)?.name || agentId;
      sections.push(`  • ${agentName}`);
    });
    sections.push('');
    sections.push('Why This Outcome:');
    sections.push('The institution\'s defense collapsed on multiple fronts. When 2 or more');
    sections.push('challenges cannot be rebutted, VerdictX determines there is sufficient');
    sections.push('evidence to warrant a formal appeal and human review.');
  } else {
    sections.push(`✗ VerdictX did not activate`);
    sections.push(`✗ Only ${concessionCount} of 4 challenges were conceded (threshold: 2)`);
    sections.push('');
    sections.push('The defense successfully rebutted enough arguments to avoid triggering');
    sections.push('the automatic appeal threshold.');
  }
  sections.push('');

  sections.push('RECOMMENDED LAWYER FOCUS');
  sections.push('────────────────────────');
  if (triggered && concededAgents.length > 0) {
    sections.push('The following areas represent the strongest grounds for appeal:');
    sections.push('');
    concededAgents.forEach(agentId => {
      const agentName = agentInfo.find(a => a.id === agentId)?.name || agentId;
      const agent = agents?.[agentId];
      
      sections.push(`${agentName}:`);
      if (agent?.data?.strongest_argument) {
        sections.push(`  ${agent.data.strongest_argument}`);
      } else if (agent?.data?.strongest_violation) {
        sections.push(`  ${agent.data.strongest_violation}`);
      } else if (agent?.data?.strongest_precedent) {
        sections.push(`  ${agent.data.strongest_precedent}`);
      } else if (agent?.content) {
        const keyLine = agent.content.split('\n').find(line => 
          line.includes('KEY') || line.includes('STRONGEST') || line.includes('ARGUMENT')
        );
        if (keyLine) {
          sections.push(`  ${keyLine.trim()}`);
        } else {
          sections.push('  Review the full argument details above');
        }
      }
      sections.push('');
    });
  } else {
    sections.push('While VerdictX did not activate, a lawyer may still find value in reviewing');
    sections.push('the AI analysis for potential manual appeal strategies.');
  }

  sections.push('═══════════════════════════════════════════════════════════════════════════');
  sections.push('End of AI Courtroom Summary');
  sections.push('═══════════════════════════════════════════════════════════════════════════');

  return sections.join('\n');
}
