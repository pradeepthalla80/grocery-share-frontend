import { useState, useEffect } from 'react';
import { itemsAPI } from '../api/items';
import { getMyRequests } from '../api/itemRequests';
import { Leaf, Recycle, Users, Package, TrendingUp, Award, Loader2, Heart, Droplets, Zap } from 'lucide-react';

interface ImpactStats {
  itemsShared: number;
  freeItemsShared: number;
  activeListings: number;
  soldItems: number;
  requestsFulfilled: number;
  totalRequests: number;
  estimatedFoodSavedKg: number;
  co2Prevented: number;
  waterSavedLiters: number;
  mealsEquivalent: number;
}

const CO2_PER_KG_FOOD_WASTE = 2.5;
const WATER_PER_KG_FOOD = 1000;
const AVG_ITEM_WEIGHT_KG = 0.8;
const MEAL_WEIGHT_KG = 0.4;

export const Impact = () => {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [itemsData, requestsData] = await Promise.all([
          itemsAPI.getMyItems(),
          getMyRequests().catch(() => ({ requests: [] })),
        ]);

        const items = itemsData.items || [];
        const requests = (requestsData as any)?.requests || requestsData || [];

        const freeItems = items.filter((i: any) => i.isFree || i.price === 0);
        const soldItems = items.filter((i: any) => i.status === 'sold' || i.status === 'completed');
        const activeItems = items.filter((i: any) => i.status === 'active' || !i.status);
        const fulfilledRequests = Array.isArray(requests) ? requests.filter((r: any) => r.status === 'fulfilled') : [];

        const sharedCount = freeItems.length + soldItems.length;
        const foodSavedKg = sharedCount * AVG_ITEM_WEIGHT_KG;
        const co2Prevented = foodSavedKg * CO2_PER_KG_FOOD_WASTE;
        const waterSaved = foodSavedKg * WATER_PER_KG_FOOD;
        const meals = foodSavedKg / MEAL_WEIGHT_KG;

        setStats({
          itemsShared: sharedCount,
          freeItemsShared: freeItems.length,
          activeListings: activeItems.length,
          soldItems: soldItems.length,
          requestsFulfilled: fulfilledRequests.length,
          totalRequests: Array.isArray(requests) ? requests.length : 0,
          estimatedFoodSavedKg: Math.round(foodSavedKg * 10) / 10,
          co2Prevented: Math.round(co2Prevented * 10) / 10,
          waterSavedLiters: Math.round(waterSaved),
          mealsEquivalent: Math.round(meals),
        });
      } catch (err) {
        console.error('Failed to fetch impact stats:', err);
        setStats({
          itemsShared: 0, freeItemsShared: 0, activeListings: 0, soldItems: 0,
          requestsFulfilled: 0, totalRequests: 0, estimatedFoodSavedKg: 0,
          co2Prevented: 0, waterSavedLiters: 0, mealsEquivalent: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!stats) return null;

  const level = stats.itemsShared >= 50 ? 'Eco Champion' :
    stats.itemsShared >= 20 ? 'Green Hero' :
    stats.itemsShared >= 10 ? 'Food Saver' :
    stats.itemsShared >= 5 ? 'Good Neighbor' :
    stats.itemsShared >= 1 ? 'Getting Started' : 'New Member';

  const levelProgress = Math.min(
    stats.itemsShared >= 50 ? 100 :
    stats.itemsShared >= 20 ? ((stats.itemsShared - 20) / 30) * 100 :
    stats.itemsShared >= 10 ? ((stats.itemsShared - 10) / 10) * 100 :
    stats.itemsShared >= 5 ? ((stats.itemsShared - 5) / 5) * 100 :
    stats.itemsShared >= 1 ? ((stats.itemsShared - 1) / 4) * 100 : 0,
    100
  );

  const nextLevel = stats.itemsShared >= 50 ? null :
    stats.itemsShared >= 20 ? 'Eco Champion' :
    stats.itemsShared >= 10 ? 'Green Hero' :
    stats.itemsShared >= 5 ? 'Food Saver' :
    stats.itemsShared >= 1 ? 'Good Neighbor' : 'Getting Started';

  const nextTarget = stats.itemsShared >= 50 ? 0 :
    stats.itemsShared >= 20 ? 50 :
    stats.itemsShared >= 10 ? 20 :
    stats.itemsShared >= 5 ? 10 :
    stats.itemsShared >= 1 ? 5 : 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">Your Impact</h1>
        <p className="text-sm text-gray-500 mt-1">See how you're making a difference</p>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-green-100 text-xs">Your Level</p>
            <p className="text-lg font-bold">{level}</p>
          </div>
        </div>
        {nextLevel && (
          <div>
            <div className="flex justify-between text-xs text-green-100 mb-1">
              <span>{stats.itemsShared} items listed</span>
              <span>{nextTarget} for {nextLevel}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        )}
        {!nextLevel && (
          <p className="text-green-100 text-sm">You've reached the highest level!</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Leaf className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Food Saved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.estimatedFoodSavedKg}<span className="text-sm font-normal text-gray-400 ml-1">kg</span></p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Recycle className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">CO₂ Prevented</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.co2Prevented}<span className="text-sm font-normal text-gray-400 ml-1">kg</span></p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Droplets className="h-4 w-4 text-cyan-600" />
            </div>
            <span className="text-xs text-gray-500">Water Saved</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.waterSavedLiters}<span className="text-sm font-normal text-gray-400 ml-1">L</span></p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">Meals Equivalent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.mealsEquivalent}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-900">Your Activity</h3>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700">Total Items Listed</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.itemsShared}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm text-gray-700">Free Items Shared</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.freeItemsShared}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-700">Active Listings</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.activeListings}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">Items Sold</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.soldItems}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-700">Requests Fulfilled</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{stats.requestsFulfilled}</span>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <p className="text-xs text-green-700 leading-relaxed">
          Environmental estimates are based on averages: each shared item prevents ~{AVG_ITEM_WEIGHT_KG}kg of food waste,
          saves ~{CO2_PER_KG_FOOD_WASTE}kg CO₂ per kg, and conserves ~{WATER_PER_KG_FOOD}L of water per kg of food.
          Keep sharing to grow your impact!
        </p>
      </div>
    </div>
  );
};
