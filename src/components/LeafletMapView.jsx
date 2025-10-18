import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Sparkles, Navigation, ExternalLink, X } from 'lucide-react';
import { getLotCoordinates, getMapCenter } from '../data/lotCoordinates';
import { hasPermission } from '../utils/permissions';
import { getStatusCardColors } from './ParkingLotsScreen';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Component to fit map bounds to show all lots
 */
const FitBounds = ({ lots }) => {
  const map = useMap();

  React.useEffect(() => {
    if (lots.length > 0) {
      const bounds = lots.map(lot => {
        const coords = getLotCoordinates(lot.id);
        return coords ? coords.center : null;
      }).filter(Boolean);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [lots, map]);

  return null;
};

/**
 * Get status-based color for lot polygons
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'complete': return '#10B981'; // Green
    case 'in-progress': return '#3B82F6'; // Blue
    case 'needs-help': return '#EF4444'; // Red
    case 'pending-approval': return '#EAB308'; // Yellow
    case 'ready': return '#14B8A6'; // Teal
    case 'not-started':
    default: return '#14B8A6'; // Teal (backward compatibility)
  }
};

/**
 * Get status label for display
 */
const getStatusLabel = (status) => {
  switch (status) {
    case 'complete': return 'Complete';
    case 'in-progress': return 'In Progress';
    case 'needs-help': return 'Needs Help';
    case 'pending-approval': return 'Pending Approval';
    case 'ready': return 'Ready';
    case 'not-started': return 'Ready'; // Backward compatibility
    default: return status;
  }
};

/**
 * Leaflet Map View Component
 */
export const LeafletMapView = ({ lots, students, currentUser, onStatusChange, getStatusStyles, StatusBadge }) => {
  const [selectedLot, setSelectedLot] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const canEdit = hasPermission(currentUser, 'canEditLotStatus');

  // Get user's assigned lot (for students)
  const assignedLot = useMemo(() => {
    if (currentUser.role === 'student') {
      return lots.find(lot => (lot.assignedStudents || []).includes(currentUser.id));
    }
    return null;
  }, [lots, currentUser]);

  // Request user location
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, []);

  // Merge lot data with coordinates
  const lotsWithCoordinates = useMemo(() => {
    return lots.map(lot => {
      const coords = getLotCoordinates(lot.id);
      if (!coords) return null;
      return {
        ...lot,
        coordinates: coords
      };
    }).filter(Boolean);
  }, [lots]);

  // Get directions to lot
  const getDirections = (lot) => {
    const coords = getLotCoordinates(lot.id);
    if (!coords) {
      alert('Location coordinates not available for this lot.');
      return;
    }

    const destination = `${coords.center[0]},${coords.center[1]}`;
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}`;
    window.open(url, '_blank');
  };

  // Calculate map center
  const mapCenter = useMemo(() => {
    return getMapCenter();
  }, []);

  if (lotsWithCoordinates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <MapPin size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Map View Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Parking lot location coordinates have not been configured yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Please contact an administrator to add latitude and longitude data to the parking lots.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="relative" style={{ height: '600px' }}>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FitBounds lots={lotsWithCoordinates} />

            {/* Render lot polygons */}
            {lotsWithCoordinates.map((lot) => {
              const color = getStatusColor(lot.status);
              const isAssigned = assignedLot?.id === lot.id;
              const assignedStudents = students.filter(s => (lot.assignedStudents || []).includes(s.id));
              const hasAICount = lot.aiStudentCount !== undefined && lot.aiStudentCount !== null && lot.aiStudentCount !== '';
              const aiCount = hasAICount ? parseInt(lot.aiStudentCount) || 0 : null;
              const manualCount = lot.totalStudentsSignedUp || 0;
              const displayCount = hasAICount ? aiCount : manualCount;

              return (
                <Polygon
                  key={lot.id}
                  positions={lot.coordinates.polygon}
                  pathOptions={{
                    color: isAssigned ? '#3B82F6' : color,
                    fillColor: isAssigned ? '#3B82F6' : color,
                    fillOpacity: 0.4,
                    weight: isAssigned ? 3 : 2
                  }}
                  eventHandlers={{
                    click: () => setSelectedLot(lot)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-gray-900 mb-2">{lot.name}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <span className="capitalize">{getStatusLabel(lot.status)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Students:</span>
                          <span>{displayCount}</span>
                          {hasAICount && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                              AI
                            </span>
                          )}
                        </div>
                        {lot.zone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Zone:</span>
                            <span className="capitalize">{lot.zone}</span>
                          </div>
                        )}
                        {isAssigned && (
                          <div className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Your Assigned Lot
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => getDirections(lot)}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Navigation size={14} />
                        Get Directions
                      </button>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Map Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { status: 'ready', label: 'Ready' },
            { status: 'in-progress', label: 'In Progress' },
            { status: 'needs-help', label: 'Needs Help' },
            { status: 'pending-approval', label: 'Pending Approval' },
            { status: 'complete', label: 'Complete' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Lot Details Modal */}
      {selectedLot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedLot.name}
              </h2>
              <button
                onClick={() => setSelectedLot(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <div className="mt-1">
                  <StatusBadge status={selectedLot.status} />
                </div>
              </div>

              {(() => {
                const hasAICount = selectedLot.aiStudentCount !== undefined && selectedLot.aiStudentCount !== null && selectedLot.aiStudentCount !== '';
                const aiCount = hasAICount ? parseInt(selectedLot.aiStudentCount) || 0 : null;
                const manualCount = selectedLot.totalStudentsSignedUp || 0;
                const displayCount = hasAICount ? aiCount : manualCount;

                return (
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Students:</span>
                    <div className="mt-1 flex items-center gap-2">
                      {hasAICount ? (
                        <Sparkles size={16} className="text-purple-500 dark:text-purple-400" />
                      ) : (
                        <Users size={16} className="text-gray-500 dark:text-gray-400" />
                      )}
                      <span className="text-gray-900 dark:text-white">{displayCount} {displayCount === 1 ? 'student' : 'students'}</span>
                      {hasAICount && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                          AI-Scanned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {selectedLot.zone && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Zone:</span>
                  <p className="mt-1 text-gray-900 dark:text-white capitalize">{selectedLot.zone}</p>
                </div>
              )}

              {selectedLot.comment && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes:</span>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedLot.comment}</p>
                </div>
              )}

              {selectedLot.lastUpdated && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated:</span>
                  <p className="mt-1 text-gray-900 dark:text-white text-sm">
                    {new Date(selectedLot.lastUpdated).toLocaleString()}
                    {selectedLot.updatedBy && ` by ${selectedLot.updatedBy}`}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => getDirections(selectedLot)}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Navigation size={18} />
              Get Directions
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

