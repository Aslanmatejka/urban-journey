import React from 'react';
import PropTypes from 'prop-types';
import { formatDate, getExpirationStatus, reportError } from "../../utils/helpers";
import Card from "../common/Card";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { useAI } from "../../utils/hooks/useSupabase";

const formatDistance = (dist) => {
    if (!dist) return '';
    if (dist < 1) return `${Math.round(dist * 1000)}m away`;
    return `${dist.toFixed(1)}km away`;
};

function FoodCard({
    food,
    onClaim,
    onTrade,
    className = '',
    showReturnButton = false,
    distance
}) {
    const { getRecipeSuggestions, isLoading: aiLoading } = useAI();
    const [showAITips, setShowAITips] = React.useState(false);
    const [aiSuggestions, setAISuggestions] = React.useState(null);

    if (!food) {
        reportError(new Error('Food data is required'));
        return null;
    }

    const {
        title,
        description,
        image_url,
        quantity,
        unit,
        expiryDate,
        location,
        donor,
        type = 'donation', // 'donation' or 'trade'
    } = food;

    const expirationStatus = getExpirationStatus(expiryDate);

    const handleClaim = () => {
        if (typeof onClaim === 'function') {
            onClaim(food);
        } else {
            console.warn('onClaim handler is not defined');
        }
    };

    const handleTrade = () => {
        if (typeof onTrade === 'function') {
            onTrade(food);
        } else {
            console.warn('onTrade handler is not defined');
        }
    };

    const handleReturn = () => {
        window.location.href = '/';
    };

    const handleAIRecipes = async () => {
        if (showAITips) {
            setShowAITips(false);
            return;
        }

        try {
            const ingredients = [title];
            const recipes = await getRecipeSuggestions(ingredients);
            setAISuggestions(recipes);
            setShowAITips(true);
        } catch (error) {
            setAISuggestions({ error: error.message || 'Failed to get recipe suggestions.' });
            setShowAITips(true);
        }
    };

    return (
        <Card
            className={`food-card ${className}`}
            image={image_url}
            title={title}
            subtitle={
                <div className="flex items-center space-x-2">
                    <span 
                        className={`badge badge-${expirationStatus.status}`}
                        role="status"
                        aria-label={`Expiration status: ${expirationStatus.label}`}
                    >
                        {expirationStatus.label}
                    </span>
                    <span className="text-gray-500">
                        {formatDate(expiryDate)}
                    </span>
                </div>
            }
            footer={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Avatar 
                            src={donor.avatar} 
                            size="sm" 
                            alt={`${donor.name}'s avatar`}
                        />
                        <span className="text-sm text-gray-600">{donor.name}</span>
                    </div>
                    <div className="flex space-x-2">
                        {type === 'donation' ? (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleClaim}
                                aria-label={`Claim ${title}`}
                                disabled={!onClaim}
                            >
                                Claim
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleTrade}
                                aria-label={`Trade ${title}`}
                                disabled={!onTrade}
                            >
                                Trade
                            </Button>
                        )}
                        {type === 'donation' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAIRecipes}
                                disabled={aiLoading}
                                aria-label={`Get AI recipe suggestions for ${title}`}
                                className="ai-recipe-btn"
                            >
                                <i className="fas fa-robot mr-1"></i>
                                {aiLoading ? 'AI...' : 'Recipes'}
                            </Button>
                        )}
                        {showReturnButton && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleReturn}
                                aria-label="Return to main site"
                            >
                                Return to Site
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-2">
                <p className="text-gray-600">{description}</p>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <i className="fas fa-box-open text-gray-400 mr-2" aria-hidden="true"></i>
                        <span>{quantity} {unit}</span>
                    </div>
                    <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2" aria-hidden="true"></i>
                        <span>{location}</span>
                    </div>
                </div>
                
                {/* AI Recipe Suggestions */}
                {showAITips && aiSuggestions && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <i className="fas fa-robot mr-2"></i>
                            AI Recipe Suggestions
                        </h4>
                        {aiSuggestions.error ? (
                            <p className="text-sm text-red-600">{aiSuggestions.error}</p>
                        ) : aiSuggestions.recipes && aiSuggestions.recipes.length > 0 ? (
                            <div className="space-y-2">
                                {aiSuggestions.recipes.slice(0, 2).map((recipe, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium text-blue-700">{recipe.name}</p>
                                        <p className="text-blue-600 text-xs">{recipe.instructions}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-blue-600">
                                {typeof aiSuggestions === 'string' ? aiSuggestions : 'No recipes found.'}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}

FoodCard.propTypes = {
    food: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        image_url: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        unit: PropTypes.string.isRequired,
        expiryDate: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['donation', 'trade']),
        donor: PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            avatar: PropTypes.string.isRequired
        }).isRequired
    }).isRequired,
    onClaim: PropTypes.func,
    onTrade: PropTypes.func,
    className: PropTypes.string,
    showReturnButton: PropTypes.bool
};

export default FoodCard;