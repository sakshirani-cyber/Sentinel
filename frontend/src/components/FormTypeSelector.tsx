import { FileText, MessageSquare, CheckSquare, ListChecks, Calendar, Star, ClipboardList, Users, BarChart3, ThumbsUp, Target, FileCheck, Vote, TrendingUp, UserCheck, Award } from 'lucide-react';

interface FormType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

interface FormTypeSelectorProps {
  onSelectFormType: (formType: string) => void;
}

export default function FormTypeSelector({ onSelectFormType }: FormTypeSelectorProps) {
  const formTypes: FormType[] = [
    {
      id: 'survey',
      name: 'Survey Form',
      description: 'Collect detailed feedback and opinions',
      icon: <FileText className="w-8 h-8" />,
      features: ['Multiple question types', 'Branching logic', 'Data analytics']
    },
    {
      id: 'poll',
      name: 'Quick Poll',
      description: 'Get quick responses from your team',
      icon: <MessageSquare className="w-8 h-8" />,
      features: ['Fast responses', 'Real-time results', 'Deadline alerts']
    },
    {
      id: 'quiz',
      name: 'Quiz Form',
      description: 'Create tests and assessments',
      icon: <CheckSquare className="w-8 h-8" />,
      features: ['Scoring system', 'Correct answers', 'Instant feedback']
    },
    {
      id: 'checklist',
      name: 'Checklist Form',
      description: 'Track completion of tasks',
      icon: <ListChecks className="w-8 h-8" />,
      features: ['Task tracking', 'Progress monitoring', 'Team visibility']
    },
    {
      id: 'event',
      name: 'Event RSVP',
      description: 'Manage event attendance',
      icon: <Calendar className="w-8 h-8" />,
      features: ['RSVP tracking', 'Attendee list', 'Reminders']
    },
    {
      id: 'feedback',
      name: 'Feedback Form',
      description: 'Collect ratings and suggestions',
      icon: <Star className="w-8 h-8" />,
      features: ['Rating scales', 'Open comments', 'Anonymous option']
    },
    {
      id: 'registration',
      name: 'Registration Form',
      description: 'Sign up participants for programs',
      icon: <ClipboardList className="w-8 h-8" />,
      features: ['Custom fields', 'Payment integration', 'Confirmation emails']
    },
    {
      id: 'assessment',
      name: 'Self Assessment',
      description: 'Employee self-evaluation forms',
      icon: <UserCheck className="w-8 h-8" />,
      features: ['Performance metrics', 'Goal tracking', 'Manager review']
    },
    {
      id: 'voting',
      name: 'Voting Form',
      description: 'Democratic decision making',
      icon: <Vote className="w-8 h-8" />,
      features: ['Secure voting', 'Anonymous ballots', 'Live results']
    },
    {
      id: 'application',
      name: 'Application Form',
      description: 'Job or program applications',
      icon: <FileCheck className="w-8 h-8" />,
      features: ['File uploads', 'Multi-step process', 'Status tracking']
    },
    {
      id: 'teambuilding',
      name: 'Team Building',
      description: 'Plan team activities and preferences',
      icon: <Users className="w-8 h-8" />,
      features: ['Activity voting', 'Schedule coordination', 'Budget tracking']
    },
    {
      id: 'satisfaction',
      name: 'Satisfaction Survey',
      description: 'Measure employee or customer satisfaction',
      icon: <ThumbsUp className="w-8 h-8" />,
      features: ['NPS scoring', 'Trend analysis', 'Benchmarking']
    },
    {
      id: 'goals',
      name: 'Goal Setting Form',
      description: 'Define and track objectives',
      icon: <Target className="w-8 h-8" />,
      features: ['SMART goals', 'Milestone tracking', 'Progress reports']
    },
    {
      id: 'performance',
      name: 'Performance Review',
      description: 'Comprehensive employee evaluations',
      icon: <Award className="w-8 h-8" />,
      features: ['360° feedback', 'Competency ratings', 'Development plans']
    },
    {
      id: 'dataCollection',
      name: 'Data Collection',
      description: 'Gather information systematically',
      icon: <BarChart3 className="w-8 h-8" />,
      features: ['Custom fields', 'Data validation', 'Export options']
    },
    {
      id: 'market',
      name: 'Market Research',
      description: 'Understand market trends and needs',
      icon: <TrendingUp className="w-8 h-8" />,
      features: ['Customer insights', 'Competitor analysis', 'Trend tracking']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-foreground mb-2">Choose Form Type</h2>
        <p className="text-foreground-secondary">Select the type of form you want to create</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formTypes.map((formType) => (
          <button
            key={formType.id}
            onClick={() => onSelectFormType(formType.id)}
            className="group relative bg-card border-2 border-border rounded-2xl p-6 hover:border-primary hover:shadow-xl transition-all duration-300 text-left card-interactive-accent"
          >
            <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative space-y-4">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-md">
                {formType.icon}
              </div>

              <div>
                <h3 className="text-foreground mb-1 font-semibold">{formType.name}</h3>
                <p className="text-sm text-muted-foreground">{formType.description}</p>
              </div>

              <div className="space-y-2">
                {formType.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}