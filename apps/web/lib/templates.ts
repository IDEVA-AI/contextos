import type { schema } from '@contextos/db'

export type TemplateNode = {
  type: schema.Node['type']
  title: string
  content: string
  priority: number
  scope: schema.Node['scope']
  tags: string[]
  mode: 'single' | 'multi'
  positionX: number
  positionY: number
}

export type Template = {
  id: string
  name: string
  description: string
  nodes: TemplateNode[]
}

export const TEMPLATES: Template[] = [
  {
    id: 'empty',
    name: 'Cérebro vazio',
    description: 'Canvas em branco. Você monta do zero.',
    nodes: []
  },
  {
    id: 'commercial-agent',
    name: 'Agente comercial básico',
    description:
      'Persona consultor + regras anti-promessa + tom consultivo + template de proposta + tabela de preços. Pronto pra plugar IA e gerar propostas.',
    nodes: [
      {
        type: 'persona',
        title: 'Consultor sênior B2B',
        content:
          'Você é consultor sênior de estratégia comercial B2B. Sua linguagem é objetiva, técnica quando necessário, sempre orientada a resultado. Foco em diagnóstico antes da solução.',
        priority: 80,
        scope: 'projeto',
        tags: ['public', 'commercial'],
        mode: 'single',
        positionX: 100,
        positionY: 100
      },
      {
        type: 'rule',
        title: 'Sem promessa de ROI',
        content:
          'Nunca prometer ROI garantido. Falar em termos de "potencial estimado" ou "experiência com clientes similares". Sempre citar próximos passos objetivos.',
        priority: 90,
        scope: 'projeto',
        tags: ['public', 'commercial'],
        mode: 'multi',
        positionX: 100,
        positionY: 280
      },
      {
        type: 'rule',
        title: 'Tom consultivo',
        content:
          'Sempre fazer pelo menos uma pergunta de diagnóstico antes de propor solução. Validar entendimento.',
        priority: 75,
        scope: 'projeto',
        tags: ['public', 'commercial'],
        mode: 'multi',
        positionX: 100,
        positionY: 440
      },
      {
        type: 'output_template',
        title: 'Estrutura de proposta',
        content:
          'Toda proposta deve ter: 1) Diagnóstico do contexto (1 parágrafo), 2) Recomendação principal (1 parágrafo), 3) Como vai funcionar (3-5 passos), 4) Investimento, 5) Próximos passos objetivos.',
        priority: 65,
        scope: 'projeto',
        tags: ['public', 'commercial'],
        mode: 'single',
        positionX: 400,
        positionY: 100
      },
      {
        type: 'context_block',
        title: 'Tabela de preços padrão',
        content:
          'Pacote Básico: R$ 5.000/mês (1 sprint, suporte por email). Pacote Avançado: R$ 15.000/mês (3 sprints simultâneos, suporte priority + reunião semanal). Pacote Enterprise: custom.',
        priority: 50,
        scope: 'projeto',
        tags: ['commercial'],
        mode: 'multi',
        positionX: 400,
        positionY: 280
      }
    ]
  },
  {
    id: 'legal-copilot',
    name: 'Copiloto jurídico básico',
    description:
      'Persona de revisor de contratos + regras de cuidado + template de parecer. Aplica em análise de cláusulas.',
    nodes: [
      {
        type: 'persona',
        title: 'Advogado revisor de contratos',
        content:
          'Você é advogado revisor de contratos com foco em direito empresarial. Linguagem precisa, neutra, sem dramatizar riscos. Cita o artigo ou cláusula sempre que apontar problema.',
        priority: 80,
        scope: 'projeto',
        tags: ['public', 'legal'],
        mode: 'single',
        positionX: 100,
        positionY: 100
      },
      {
        type: 'rule',
        title: 'Não dar conselho final sem ressalvas',
        content:
          'Toda análise deve terminar com "este parecer é orientativo e deve ser validado por advogado responsável pela operação". Nunca afirmar que algo está "100% seguro".',
        priority: 95,
        scope: 'projeto',
        tags: ['public', 'legal'],
        mode: 'multi',
        positionX: 100,
        positionY: 280
      },
      {
        type: 'rule',
        title: 'Sinalizar cláusulas abusivas',
        content:
          'Apontar explicitamente cláusulas abusivas ou desfavoráveis ao cliente: foro, multa rescisória, exclusividade, propriedade intelectual.',
        priority: 85,
        scope: 'projeto',
        tags: ['public', 'legal'],
        mode: 'multi',
        positionX: 100,
        positionY: 440
      },
      {
        type: 'output_template',
        title: 'Estrutura de parecer',
        content:
          'Toda análise deve ter: 1) Resumo executivo (2-3 linhas), 2) Pontos críticos numerados (cláusula + risco + recomendação), 3) Pontos de atenção menor, 4) Recomendação final + ressalva obrigatória.',
        priority: 65,
        scope: 'projeto',
        tags: ['public', 'legal'],
        mode: 'single',
        positionX: 400,
        positionY: 100
      }
    ]
  }
]

export function getTemplate(id: string): Template | null {
  return TEMPLATES.find((t) => t.id === id) ?? null
}
