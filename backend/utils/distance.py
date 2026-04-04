"""
utils/distance.py - Geographic distance calculations using Haversine formula
"""

import math
from typing import List, Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS points.
    Uses the Haversine formula for accuracy over short distances.
    
    Args:
        lat1, lon1: Latitude and longitude of point 1 (degrees)
        lat2, lon2: Latitude and longitude of point 2 (degrees)
    
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers

    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))

    return R * c


def estimate_travel_time(distance_km: float, speed_kmh: float = 30) -> float:
    """
    Estimate travel time based on distance and average speed.
    Default speed of 30 km/h accounts for city traffic.
    
    Returns:
        Estimated time in minutes
    """
    return (distance_km / speed_kmh) * 60


def nearest_neighbor_tsp(
    points: List[Tuple[float, float]],
    start_idx: int = 0
) -> Tuple[List[int], float]:
    """
    Nearest Neighbor TSP approximation algorithm.
    Finds a near-optimal route visiting all points exactly once.
    
    Args:
        points: List of (latitude, longitude) tuples
        start_idx: Index of the starting point (e.g., depot)
    
    Returns:
        Tuple of (ordered_indices, total_distance_km)
    """
    n = len(points)
    if n == 0:
        return [], 0.0
    if n == 1:
        return [0], 0.0

    visited = [False] * n
    route = [start_idx]
    visited[start_idx] = True
    total_distance = 0.0

    for _ in range(n - 1):
        current = route[-1]
        current_lat, current_lon = points[current]
        
        best_dist = float("inf")
        best_idx = -1

        # Find nearest unvisited point
        for j in range(n):
            if not visited[j]:
                dist = haversine_distance(
                    current_lat, current_lon,
                    points[j][0], points[j][1]
                )
                if dist < best_dist:
                    best_dist = dist
                    best_idx = j

        if best_idx != -1:
            route.append(best_idx)
            visited[best_idx] = True
            total_distance += best_dist

    return route, total_distance
