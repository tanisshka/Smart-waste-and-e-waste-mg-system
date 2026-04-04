"""
utils/clustering.py - K-Means clustering for grouping nearby waste pickup requests
Groups geographically close requests to minimize travel distance for drivers.
"""

import numpy as np
from sklearn.cluster import KMeans
from typing import List, Dict, Any, Tuple
from utils.distance import nearest_neighbor_tsp, estimate_travel_time


def optimal_cluster_count(n_points: int, max_clusters: int = 8) -> int:
    """
    Determine optimal number of clusters using simple heuristic.
    Rule: ~5-8 stops per driver route is efficient.
    
    Args:
        n_points: Total number of pickup points
        max_clusters: Maximum allowed clusters
    
    Returns:
        Recommended number of clusters
    """
    if n_points <= 3:
        return 1
    if n_points <= 6:
        return 2
    # Aim for ~6 stops per cluster, cap at max_clusters
    return min(max(1, n_points // 6), max_clusters)


def cluster_requests(
    requests: List[Dict[str, Any]],
    n_clusters: int = None
) -> Dict[int, List[Dict]]:
    """
    Group pickup requests into geographic clusters using K-Means.
    
    Args:
        requests: List of request dicts with 'location.coordinates' [lon, lat]
        n_clusters: Number of clusters (auto-detected if None)
    
    Returns:
        Dict mapping cluster_id -> list of requests in that cluster
    """
    if not requests:
        return {}

    # Extract coordinates (convert from GeoJSON [lon, lat] to [lat, lon] for clustering)
    coords = []
    for req in requests:
        lon, lat = req["location"]["coordinates"]
        coords.append([lat, lon])

    coords_array = np.array(coords)
    n = len(requests)

    # Auto-detect cluster count
    if n_clusters is None:
        n_clusters = optimal_cluster_count(n)

    # K-Means only makes sense if we have more points than clusters
    n_clusters = min(n_clusters, n)

    if n_clusters == 1:
        # All in one cluster
        clusters = {0: requests}
        return clusters

    # Run K-Means clustering
    kmeans = KMeans(
        n_clusters=n_clusters,
        random_state=42,
        n_init=10,
        max_iter=300
    )
    labels = kmeans.fit_predict(coords_array)

    # Group requests by cluster label
    clusters: Dict[int, List[Dict]] = {}
    for idx, label in enumerate(labels):
        cluster_id = int(label)
        if cluster_id not in clusters:
            clusters[cluster_id] = []
        clusters[cluster_id].append(requests[idx])

    return clusters


def optimize_cluster_routes(
    clusters: Dict[int, List[Dict]]
) -> List[Dict[str, Any]]:
    """
    For each cluster, compute optimized pickup route using Nearest Neighbor TSP.
    
    Args:
        clusters: Output of cluster_requests()
    
    Returns:
        List of route plans, one per cluster:
        {
            cluster_id, 
            ordered_requests,
            total_distance_km,
            estimated_time_minutes,
            stop_count
        }
    """
    route_plans = []

    for cluster_id, requests in clusters.items():
        if not requests:
            continue

        # Extract (lat, lon) tuples for TSP
        points = []
        for req in requests:
            lon, lat = req["location"]["coordinates"]
            points.append((lat, lon))

        # Apply Nearest Neighbor TSP starting from first point
        ordered_indices, total_distance = nearest_neighbor_tsp(points, start_idx=0)
        
        # Reorder requests according to optimized route
        ordered_requests = [requests[i] for i in ordered_indices]
        
        # Estimate travel time (30 km/h average city speed)
        estimated_time = estimate_travel_time(total_distance, speed_kmh=30)

        route_plans.append({
            "cluster_id": cluster_id,
            "ordered_requests": ordered_requests,
            "total_distance_km": round(total_distance, 2),
            "estimated_time_minutes": round(estimated_time),
            "stop_count": len(ordered_requests)
        })

    # Sort by cluster_id for consistent output
    route_plans.sort(key=lambda x: x["cluster_id"])
    return route_plans
