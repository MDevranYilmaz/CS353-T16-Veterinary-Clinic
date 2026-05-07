'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { vetApi, evaluationApi } from '@/lib/api'
import type { Veterinarian, VetEvaluations, EvaluationReview } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Star, MessageSquare, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectedEval {
  eval: EvaluationReview
  vetName: string
}

export function StaffView() {
  const { user } = useAuth()
  const [vets, setVets] = useState<Veterinarian[]>([])
  const [evals, setEvals] = useState<Record<string, VetEvaluations>>({})
  const [selectedEval, setSelectedEval] = useState<SelectedEval | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedVet, setExpandedVet] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.branchId) {
      setLoading(false)
      return
    }

    const loadStaffEvaluations = async () => {
      try {
        const vetList = await vetApi.list({ branch_id: String(user.branchId) })
        setVets(vetList)

        const evals: Record<string, VetEvaluations> = {}
        await Promise.all(
          vetList.map(async (vet) => {
            try {
              const data = await evaluationApi.forVet(vet.id)
              evals[vet.id] = data
            } catch (e) {
              console.error(`Failed to fetch evaluations for vet ${vet.id}:`, e)
              evals[vet.id] = { rating: null, reviews: [] }
            }
          })
        )
        setEvals(evals)
      } catch (e) {
        console.error('Failed to load staff:', e)
      } finally {
        setLoading(false)
      }
    }

    loadStaffEvaluations()
  }, [user?.branchId])

  const allReviews = Object.values(evals).flatMap((e) => e.reviews)
  const avgRating =
    allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + Number(r.points), 0) / allReviews.length).toFixed(1)
      : '—'

  const statCards = [
    { icon: Users, value: vets.length, label: 'Veterinarians', color: 'bg-primary/10 text-primary' },
    { icon: Star, value: avgRating, label: 'Avg Rating', color: 'bg-accent/10 text-accent-foreground' },
    { icon: MessageSquare, value: allReviews.length, label: 'Total Reviews', color: 'bg-blue-500/10 text-blue-600' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (vets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No veterinarians found</p>
          <p className="text-sm text-muted-foreground mt-1">Your branch has no assigned veterinarians.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Veterinarians List */}
      <div className="space-y-4">
        {vets.map((vet) => {
          const vetEvals = evals[vet.id]
          const vetReviews = vetEvals?.reviews || []
          const isExpanded = expandedVet === vet.id

          return (
            <Card key={vet.id} className="hover:shadow-md transition-shadow">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedVet(isExpanded ? null : vet.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 bg-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(vet.name || 'V').split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{vet.name}</CardTitle>
                      <CardDescription className="capitalize">{vet.specialization}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vetEvals?.rating && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {Number(vetEvals.rating.avg_rating).toFixed(1)}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      {vetReviews.length} {vetReviews.length === 1 ? 'review' : 'reviews'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-3">
                  {vetReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No evaluations yet</p>
                  ) : (
                    <div className="space-y-2 border-t pt-3">
                      {vetReviews.map((review) => (
                        <div
                          key={review.eval_id}
                          onClick={() => setSelectedEval({ eval: review, vetName: vet.name })}
                          className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{review.owner_name}</span>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        'w-3 h-3',
                                        i < Number(review.points)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground/30'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                              {review.comment && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                            <MessageSquare className="w-4 h-4 text-muted-foreground/50 mt-1 shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Evaluation Detail Dialog */}
      <Dialog open={selectedEval !== null} onOpenChange={() => setSelectedEval(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
            <DialogDescription>{selectedEval?.vetName}</DialogDescription>
          </DialogHeader>
          {selectedEval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{selectedEval.eval.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedEval.eval.date}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Rating</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Number(selectedEval.eval.points)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              </div>

              {selectedEval.eval.comment && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Comment</p>
                  <p className="text-sm leading-relaxed">{selectedEval.eval.comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
