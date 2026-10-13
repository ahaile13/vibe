import { Suspense } from 'react';
import { Discover } from '@/components/Discover';

export default function Page() {
  return (
    <Suspense>
      <Discover />
    </Suspense>
  );
}
