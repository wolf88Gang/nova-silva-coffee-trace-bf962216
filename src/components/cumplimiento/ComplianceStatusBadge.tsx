import { Badge } from '@/components/ui/badge';

interface Props {
  nivel: string;
}

export default function ComplianceStatusBadge({ nivel }: Props) {
  switch (nivel) {
    case 'prohibido':
    case 'lista_roja':
    case 'cancelado':
      return <Badge variant="destructive">{nivel.replace('_', ' ')}</Badge>;
    case 'lista_naranja':
    case 'restringido':
    case 'phase_out_2026':
      return <Badge variant="outline" className="border-destructive/50 text-destructive">{nivel.replace('_', ' ')}</Badge>;
    case 'lista_amarilla':
    case 'phase_out_2030':
      return <Badge variant="outline">{nivel.replace('_', ' ')}</Badge>;
    case 'permitido':
      return <Badge variant="default">{nivel}</Badge>;
    default:
      return <Badge variant="secondary">{nivel}</Badge>;
  }
}
