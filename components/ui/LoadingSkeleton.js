export default function LoadingSkeleton({
  className = '',
  rounded = 'rounded-2xl',
}) {
  return <div className={`loading-shimmer ${rounded} ${className}`} aria-hidden="true" />
}
