import { useQuery } from "@tanstack/react-query";

export function AIRecommendations() {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold mb-2">AI-Powered Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            Personalized suggestions for your travel and contract management
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-3"></div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getRecommendationStyle = (type: string) => {
    switch (type) {
      case 'travel':
        return {
          containerClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200',
          iconClass: 'bg-blue-100 text-blue-600',
          titleClass: 'text-blue-900',
          descriptionClass: 'text-blue-700',
          buttonClass: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'contract':
        return {
          containerClass: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200',
          iconClass: 'bg-amber-100 text-amber-600',
          titleClass: 'text-amber-900',
          descriptionClass: 'text-amber-700',
          buttonClass: 'bg-amber-600 hover:bg-amber-700'
        };
      case 'payment':
        return {
          containerClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200',
          iconClass: 'bg-green-100 text-green-600',
          titleClass: 'text-green-900',
          descriptionClass: 'text-green-700',
          buttonClass: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          containerClass: 'bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200',
          iconClass: 'bg-gray-100 text-gray-600',
          titleClass: 'text-gray-900',
          descriptionClass: 'text-gray-700',
          buttonClass: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'travel':
        return 'fas fa-map-marker-alt';
      case 'contract':
        return 'fas fa-exclamation-triangle';
      case 'payment':
        return 'fas fa-dollar-sign';
      default:
        return 'fas fa-lightbulb';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold mb-2">AI-Powered Recommendations</h3>
        <p className="text-sm text-muted-foreground">
          Personalized suggestions for your travel and contract management
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recommendations && recommendations.length > 0 ? (
            recommendations.slice(0, 3).map((recommendation: any) => {
              const style = getRecommendationStyle(recommendation.type);
              const icon = getRecommendationIcon(recommendation.type);
              
              return (
                <div
                  key={recommendation.id}
                  className={`rounded-lg p-4 ${style.containerClass}`}
                  data-testid={`recommendation-${recommendation.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`rounded-full p-2 mt-1 ${style.iconClass}`}>
                      <i className={`${icon} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium mb-2 ${style.titleClass}`} data-testid={`text-title-${recommendation.id}`}>
                        {recommendation.title}
                      </h4>
                      <p className={`text-sm mb-3 ${style.descriptionClass}`} data-testid={`text-description-${recommendation.id}`}>
                        {recommendation.description}
                      </p>
                      <button className={`text-sm text-white px-3 py-1 rounded-md transition-colors ${style.buttonClass}`} data-testid={`button-action-${recommendation.id}`}>
                        {recommendation.type === 'travel' ? 'View Options' : 
                         recommendation.type === 'contract' ? 'Review Contracts' : 
                         'View Opportunities'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <div className="bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <i className="fas fa-robot text-2xl"></i>
              </div>
              <p className="text-lg font-medium mb-2">No recommendations yet</p>
              <p className="text-sm">
                Upload some contracts or add travel preferences to get personalized AI recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
