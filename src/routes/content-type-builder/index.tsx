import { createFileRoute } from '@tanstack/react-router'
import { ContentTypeBuilder } from '@/components/content-type-builder'

export const Route = createFileRoute('/content-type-builder/')({
  component: () => <ContentTypeBuilder />,
})