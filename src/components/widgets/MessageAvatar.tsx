import { Avatar } from '@/components/ui/avatar'
import { Robot, User } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface MessageAvatarProps {
  isUser: boolean
}

export function MessageAvatar({ isUser }: MessageAvatarProps) {
  return (
    <Avatar className={cn('w-8 h-8 flex-shrink-0', isUser ? 'bg-accent' : 'bg-primary')}>
      <div className="w-full h-full flex items-center justify-center">
        {isUser ? (
          <User weight="bold" className="w-5 h-5 text-accent-foreground" />
        ) : (
          <Robot weight="bold" className="w-5 h-5 text-primary-foreground" />
        )}
      </div>
    </Avatar>
  )
}
