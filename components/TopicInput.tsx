import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon } from './icons/ImageIcon';
import { PlayIcon } from './icons/PlayIcon';

type SimulationType = 'image' | 'video';

interface TopicInputProps {
    onSubmit: (topic: string, type: SimulationType) => void;
    loading: boolean;
}

const TopicInput: React.FC<TopicInputProps> = ({ onSubmit, loading }) => {
    const [topic, setTopic] = useState('');
    const [simulationType, setSimulationType] = useState<SimulationType>('image');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim() && !loading) {
            onSubmit(topic.trim(), simulationType);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, Mitosis, The Human Heart..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-shadow duration-200"
                disabled={loading}
                aria-label="Biology Topic"
            />

            <fieldset className="grid grid-cols-2 gap-3">
                <legend className="sr-only">Select simulation type</legend>
                <div>
                    <input
                        type="radio"
                        name="simulationType"
                        value="image"
                        id="image-type"
                        className="sr-only"
                        checked={simulationType === 'image'}
                        onChange={() => setSimulationType('image')}
                        disabled={loading}
                    />
                    <label htmlFor="image-type" className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg border cursor-pointer transition-all duration-200 ${simulationType === 'image' ? 'bg-sky-500 border-sky-500 text-white shadow-md ring-2 ring-offset-1 ring-sky-300' : 'bg-white border-slate-300 text-slate-700 hover:border-sky-400'}`}>
                        <ImageIcon className="h-5 w-5" />
                        <span className="font-semibold text-sm sm:text-base">Image Simulation</span>
                    </label>
                </div>
                <div>
                    <input
                        type="radio"
                        name="simulationType"
                        value="video"
                        id="video-type"
                        className="sr-only"
                        checked={simulationType === 'video'}
                        onChange={() => setSimulationType('video')}
                        disabled={loading}
                    />
                    <label htmlFor="video-type" className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg border cursor-pointer transition-all duration-200 ${simulationType === 'video' ? 'bg-sky-500 border-sky-500 text-white shadow-md ring-2 ring-offset-1 ring-sky-300' : 'bg-white border-slate-300 text-slate-700 hover:border-sky-400'}`}>
                        <PlayIcon className="h-5 w-5" />
                        <span className="font-semibold text-sm sm:text-base">Video Simulation</span>
                    </label>
                </div>
            </fieldset>

            <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-500 text-white font-semibold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200"
            >
                {loading ? (
                    <>
                        <LoadingSpinner className="h-5 w-5" />
                        Generating...
                    </>
                ) : (
                    'Create Simulation'
                )}
            </button>
        </form>
    );
};

export default TopicInput;