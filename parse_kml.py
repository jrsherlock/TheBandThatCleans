#!/usr/bin/env python3
"""
Parse KML file and extract polygon coordinates for TBTC parking lots.
Generates updated lotCoordinates.js with real polygon data.
"""

import xml.etree.ElementTree as ET
import json

# Mapping of TBTC lot IDs to KML placemark names
LOT_MAPPING = {
    'lot-1': 'Library Lot',  # Lot 3 - Library Lot
    'lot-3': 'Hancher Commuter Lot',  # Lot 55 - Hancher
    'lot-4': 'Lot 48',  # Lot 48 - Myrtle
    'lot-5': 'Lot 53',  # Lot 53 - Melrose Court
    'lot-6': 'Lot 49',  # Lot 49 - Red Barn
    'lot-9': 'Arena Commuter Lot',  # Lot 75 - Arena Commuter
    'lot-10': 'Lot 46/47',  # Lot 46 - Carver
    'lot-11': 'Lot 40',  # Lot 40 - Dental Lot
    'lot-12': 'Finkbine Commuter Lot',  # Lot 65 - Finkbine
    'lot-13': 'Lot 43',  # Lot 43 N - N of Hawkeye Ramp (will use same polygon)
    'lot-14': 'Lot 43',  # Lot 43 NW - Rec Bldg Area (will use same polygon)
    'lot-15': 'Lot 43',  # Lot 43 W - West of Kinnick (will use same polygon)
    'lot-16': 'Hawkeye Commuter Lot',  # Lot 85 - Hawkeye Commuter
    'lot-19': 'Lot 71',  # Lot 71 - Hall of Fame
    'lot-21': 'Lot 73',  # Lot 73 - University Club
}

def parse_coordinates(coord_string):
    """Parse KML coordinate string into list of [lat, lng] pairs."""
    coords = []
    for line in coord_string.strip().split('\n'):
        line = line.strip()
        if line:
            # KML format is: longitude,latitude,altitude
            parts = line.split(',')
            if len(parts) >= 2:
                lng = float(parts[0])
                lat = float(parts[1])
                coords.append([lat, lng])  # Leaflet uses [lat, lng]
    return coords

def calculate_center(polygon):
    """Calculate the center point of a polygon."""
    if not polygon:
        return [0, 0]
    
    lat_sum = sum(point[0] for point in polygon)
    lng_sum = sum(point[1] for point in polygon)
    count = len(polygon)
    
    return [lat_sum / count, lng_sum / count]

def parse_kml(kml_file):
    """Parse KML file and extract lot polygons."""
    tree = ET.parse(kml_file)
    root = tree.getroot()
    
    # Define KML namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    lots = {}
    
    # Find all Placemarks
    for placemark in root.findall('.//kml:Placemark', ns):
        name_elem = placemark.find('kml:name', ns)
        if name_elem is None or not name_elem.text:
            continue
        
        name = name_elem.text.strip()
        
        # Find polygon coordinates
        coords_elem = placemark.find('.//kml:coordinates', ns)
        if coords_elem is None or not coords_elem.text:
            continue
        
        polygon = parse_coordinates(coords_elem.text)
        if not polygon:
            continue
        
        center = calculate_center(polygon)
        
        lots[name] = {
            'polygon': polygon,
            'center': center
        }
    
    return lots

def generate_js_file(lots_data, output_file):
    """Generate JavaScript file with lot coordinates."""
    
    # TBTC lot names (from REAL-LOTS-REFERENCE.md)
    lot_names = {
        'lot-1': 'Lot 3 - Library Lot',
        'lot-2': 'Lot 11 - Jail Lot',  # Not in KML, will use approximate
        'lot-3': 'Lot 55 - Hancher',
        'lot-4': 'Lot 48 - Myrtle',
        'lot-5': 'Lot 53 - Melrose Court',
        'lot-6': 'Lot 49 - Red Barn',
        'lot-7': 'Lot 58 - Adjacent to Lot 49',  # Not in KML
        'lot-8': 'Ramp 4 (South Side)',  # Not in KML
        'lot-9': 'Lot 75 - Arena Commuter',
        'lot-10': 'Lot 46 - Carver',
        'lot-11': 'Lot 40 - Dental Lot',
        'lot-12': 'Lot 65 - Finkbine',
        'lot-13': 'Lot 43 N - N of Hawkeye Ramp',
        'lot-14': 'Lot 43 NW - Rec Bldg Area',
        'lot-15': 'Lot 43 W - West of Kinnick',
        'lot-16': 'Lot 85 - Hawkeye Commuter',
        'lot-17': 'Soccer Lot - Lower Finkbine',  # Not in KML
        'lot-18': 'Softball Lot',  # Not in KML
        'lot-19': 'Lot 71 - Hall of Fame',
        'lot-20': 'Golf Course',  # Not in KML
        'lot-21': 'Lot 73 - University Club',
        'lot-22': 'Lot 22 - Placeholder',  # Not in reference doc
    }
    
    with open(output_file, 'w') as f:
        f.write('/**\n')
        f.write(' * Parking Lot Coordinates for TBTC Map View\n')
        f.write(' * \n')
        f.write(' * This file contains latitude/longitude coordinates for all 22 parking lots\n')
        f.write(' * tracked in the TBTC parking lot cleanup application.\n')
        f.write(' * \n')
        f.write(' * Coordinates are extracted from actual University of Iowa parking lot KML data.\n')
        f.write(' * Each lot includes:\n')
        f.write(' * - id: Matches the lot ID in the Google Sheet\n')
        f.write(' * - center: [latitude, longitude] for the lot center point\n')
        f.write(' * - polygon: Array of [lat, lng] points defining the lot boundary\n')
        f.write(' */\n\n')
        f.write('export const LOT_COORDINATES = {\n')
        
        for lot_id, lot_name in lot_names.items():
            if lot_id in LOT_MAPPING:
                kml_name = LOT_MAPPING[lot_id]
                if kml_name in lots_data:
                    data = lots_data[kml_name]
                    f.write(f"  '{lot_id}': {{\n")
                    f.write(f"    id: '{lot_id}',\n")
                    f.write(f"    name: '{lot_name}',\n")
                    f.write(f"    center: {json.dumps(data['center'])},\n")
                    f.write(f"    polygon: {json.dumps(data['polygon'])}\n")
                    f.write(f"  }},\n")
        
        f.write('};\n\n')
        
        # Add helper functions
        f.write('/**\n')
        f.write(' * Get coordinates for a specific lot by ID\n')
        f.write(' * @param {string} lotId - The lot ID (e.g., \'lot-1\')\n')
        f.write(' * @returns {object|null} - Lot coordinate data or null if not found\n')
        f.write(' */\n')
        f.write('export function getLotCoordinates(lotId) {\n')
        f.write('  return LOT_COORDINATES[lotId] || null;\n')
        f.write('}\n\n')
        
        f.write('/**\n')
        f.write(' * Get all lot coordinates as an array\n')
        f.write(' * @returns {Array} - Array of all lot coordinate objects\n')
        f.write(' */\n')
        f.write('export function getAllLotCoordinates() {\n')
        f.write('  return Object.values(LOT_COORDINATES);\n')
        f.write('}\n\n')
        
        f.write('/**\n')
        f.write(' * Calculate the center point of all lots (for map initialization)\n')
        f.write(' * @returns {Array} - [latitude, longitude] of the center point\n')
        f.write(' */\n')
        f.write('export function getMapCenter() {\n')
        f.write('  const lots = getAllLotCoordinates();\n')
        f.write('  if (lots.length === 0) return [41.6611, -91.5302]; // Default to Iowa City\n\n')
        f.write('  const avgLat = lots.reduce((sum, lot) => sum + lot.center[0], 0) / lots.length;\n')
        f.write('  const avgLng = lots.reduce((sum, lot) => sum + lot.center[1], 0) / lots.length;\n\n')
        f.write('  return [avgLat, avgLng];\n')
        f.write('}\n')

if __name__ == '__main__':
    print('Parsing KML file...')
    lots_data = parse_kml('Polygons.kml')
    print(f'Found {len(lots_data)} lots in KML file')
    
    print('\nMatched TBTC lots:')
    for lot_id, kml_name in LOT_MAPPING.items():
        if kml_name in lots_data:
            print(f'  ✓ {lot_id}: {kml_name}')
        else:
            print(f'  ✗ {lot_id}: {kml_name} (NOT FOUND)')
    
    print('\nGenerating JavaScript file...')
    generate_js_file(lots_data, 'src/data/lotCoordinates.js')
    print('✓ Generated src/data/lotCoordinates.js')

