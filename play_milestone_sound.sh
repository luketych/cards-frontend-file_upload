#!/bin/bash

# Function to play sound
play_sound() {
    local sound_file=$1
    
    if [ ! -f "$sound_file" ]; then
        echo "Error: Sound file '$sound_file' not found."
        exit 1
    fi
    
    afplay "$sound_file"
}

# Default to system sound if no argument provided
DEFAULT_SOUND="/System/Library/Sounds/Hero.aiff"
SOUND_FILE=${1:-$DEFAULT_SOUND}

echo "Playing sound: $SOUND_FILE"
play_sound "$SOUND_FILE"
