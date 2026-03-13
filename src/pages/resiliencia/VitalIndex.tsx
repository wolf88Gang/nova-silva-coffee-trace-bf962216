import { useOperatingModel } from '@/lib/operatingModel';
import SostenibilidadHub from '@/pages/productor/SostenibilidadHub';
import VitalOrgView from './VitalOrgView';

export default function VitalIndex() {
  const model = useOperatingModel();

  // For single farm / estate producers, show the producer VITAL hub directly
  if (model === 'single_farm' || model === 'estate') {
    return <SostenibilidadHub />;
  }

  return <VitalOrgView />;
}
