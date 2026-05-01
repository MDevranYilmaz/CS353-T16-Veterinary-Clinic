'use client'

import { useState } from 'react'
import { evaluationApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

interface EvaluationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vetId: string
  vetName: string
  onSuccess?: () => void
}

export function EvaluationModal({
  open,
  onOpenChange,
  vetId,
  vetName,
  onSuccess,
}: EvaluationModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const handleClose = () => {
    if (saving) return
    setRating(0)
    setHovered(0)
    setComment('')
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!rating) return
    setSaving(true)
    try {
      await evaluationApi.create({
        points: rating,
        date: new Date().toISOString().slice(0, 10),
        comment: comment.trim() || undefined,
        vet_id: Number(vetId),
      })
      setRating(0)
      setComment('')
      onSuccess?.()
      onOpenChange(false)
    } catch (e) {
      console.error('[EvaluationModal] submit error:', e)
    } finally {
      setSaving(false)
    }
  }

  const activeStars = hovered || rating

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Veterinarian</DialogTitle>
          <DialogDescription>Share your experience with {vetName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label>Overall Rating</Label>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-colors',
                        activeStars >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-all',
                  activeStars > 0 ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {activeStars > 0 ? ratingLabels[activeStars] : 'Select a rating'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="eval-comment">Comments (optional)</Label>
            <Textarea
              id="eval-comment"
              placeholder="Tell us about your experience with this veterinarian..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!rating || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
