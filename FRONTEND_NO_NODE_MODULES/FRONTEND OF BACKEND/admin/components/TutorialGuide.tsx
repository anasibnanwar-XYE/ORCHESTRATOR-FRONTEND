import React, { useEffect } from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import './tutorial-custom.css'; // We'll create this for custom styling

interface TutorialGuideProps {
    steps: any[];
    enabled: boolean;
    onExit: () => void;
    initialStep?: number;
}

export default function TutorialGuide({ steps, enabled, onExit, initialStep = 0 }: TutorialGuideProps) {

    // Filter steps to only include those that have a corresponding element in the DOM
    const safeSteps = (steps || []).filter(step => {
        if (!step.element) return true; // Introductory steps without element
        try {
            return !!document.querySelector(step.element);
        } catch {
            return false;
        }
    });

    return (
        <Steps
            enabled={enabled && safeSteps.length > 0}
            steps={safeSteps}
            initialStep={initialStep}
            onExit={onExit}
            onComplete={onExit}
            options={{
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: true,
                exitOnEsc: true,
                nextLabel: 'Next',
                prevLabel: 'Back',
                doneLabel: 'Done',
                tooltipClass: 'custom-intro-tooltip',
                highlightClass: 'custom-intro-highlight',
            }}
        />
    );
}
