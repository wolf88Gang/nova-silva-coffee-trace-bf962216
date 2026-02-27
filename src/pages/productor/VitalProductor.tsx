import { VitalGate } from '@/components/auth/VitalGate';
import ClimaProductorWizard from '@/components/clima/ClimaProductorWizard';

export default function VitalProductor() {
  return (
    <VitalGate mode="banner">
      <div className="space-y-6 animate-fade-in">
        <ClimaProductorWizard />
      </div>
    </VitalGate>
  );
}
