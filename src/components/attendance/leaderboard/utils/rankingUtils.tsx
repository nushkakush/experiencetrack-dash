import { Trophy, Award, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export class RankingUtils {
  static getRankBadge(rank: number) {
    if (rank === 1) {
      return (
        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
          <Trophy className="h-3 w-3 mr-1" />
          #1
        </Badge>
      );
    } else if (rank === 2) {
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-500">
          <Award className="h-3 w-3 mr-1" />
          #2
        </Badge>
      );
    } else if (rank === 3) {
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-700">
          <Award className="h-3 w-3 mr-1" />
          #3
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          #{rank}
        </Badge>
      );
    }
  }

  static getStreakBadge(streak: number) {
    if (streak >= 10) {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else if (streak >= 5) {
      return (
        <Badge className="bg-blue-500 text-white hover:bg-blue-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else if (streak > 0) {
      return (
        <Badge variant="secondary">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <TrendingUp className="h-3 w-3 mr-1" />
          0
        </Badge>
      );
    }
  }
}
