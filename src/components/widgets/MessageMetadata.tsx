import { EndpointConfig } from '@/lib/types'

interface MessageMetadataProps {
  endpoint?: EndpointConfig
}

export function MessageMetadata({ endpoint }: MessageMetadataProps) {
  if (!endpoint) return null

  return (
    <p className="text-xs text-muted-foreground px-1">
      {endpoint.name} • {endpoint.modelName}
    </p>
  )
}
