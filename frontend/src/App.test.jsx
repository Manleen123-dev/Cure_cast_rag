import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import App from './App.jsx';

vi.mock('axios');

const symptomList = ['fever', 'cough', 'fatigue', 'headache'];

const predictionResponse = {
  checked_at: '2026-08-22T10:30:00+00:00',
  selected_symptoms: ['fever', 'cough'],
  prediction: {
    disease: 'Flu',
    confidence: 72.0,
    probability: 0.72,
    severity: 'Moderate',
    specialist: 'General Physician',
    sample_count: 120,
  },
  alternatives: [
    {
      disease: 'Common Cold',
      confidence: 18.0,
      probability: 0.18,
      severity: 'Mild',
      specialist: 'General Physician',
      sample_count: 90,
    },
    {
      disease: 'Pneumonia',
      confidence: 7.0,
      probability: 0.07,
      severity: 'Severe',
      specialist: 'Pulmonologist',
      sample_count: 42,
    },
    {
      disease: 'Asthma',
      confidence: 3.0,
      probability: 0.03,
      severity: 'Moderate',
      specialist: 'Pulmonologist',
      sample_count: 76,
    },
  ],
  explanation: {
    headline: 'Flu is the leading current match',
    summary: 'CureCast ranked Flu as the strongest current match.',
    why_it_matches: [
      'The prediction model found the overall symptom pattern more consistent with Flu than the next alternatives.',
      'The retrieved disease reference overlaps with symptoms such as fever and cough.',
    ],
    medical_context: 'Flu is an infectious respiratory illness.',
    care_guidance: 'Consult a clinician if symptoms worsen or do not improve.',
    triage_note: 'Monitor symptoms and seek urgent care if symptoms escalate.',
    matched_symptoms: ['fever', 'cough'],
    sources: [
      {
        title: 'Flu knowledge card',
        source: 'flu.json',
        relevance: 0.91,
        method: 'keyword',
        excerpt: 'Disease: Flu. Description: Flu is an infectious respiratory illness.',
      },
    ],
    read_more: {
      description: 'Flu is an infectious respiratory illness.',
      causes: 'Influenza viruses spread through droplets.',
      when_to_see_doctor: 'Seek care if symptoms worsen or breathing becomes difficult.',
    },
  },
  retrieval_mode: 'keyword',
  disclaimer: 'CureCast offers screening support only and is not a substitute for professional medical advice.',
};

describe('App', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: symptomList });
    axios.post.mockResolvedValue({ data: predictionResponse });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads symptoms and shows the landing and checker experience', async () => {
    render(<App />);

    expect(screen.getByText(/a clearer first step toward/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /check symptoms/i }).length
    ).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText(/4 known symptoms/i)).toBeInTheDocument();
    });
  });

  it('submits symptoms and renders prediction, explanation, and history', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/4 known symptoms/i);

    const searchInput = screen.getByLabelText(/search symptoms/i);
    await user.type(searchInput, 'fev');
    await user.click(await screen.findByRole('button', { name: /fever/i }));

    await user.type(searchInput, 'cou');
    await user.click(await screen.findByRole('button', { name: /cough/i }));

    expect(screen.getByText('fever')).toBeInTheDocument();
    expect(screen.getByText('cough')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /analyze symptoms/i }));

    await screen.findAllByText('Flu');
    expect(axios.post).toHaveBeenCalledWith('http://127.0.0.1:5000/predict', {
      symptoms: ['fever', 'cough'],
    });

    expect(screen.getByText(/flu is the leading current match/i)).toBeInTheDocument();
    expect(screen.getAllByText(/evidence used/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/past checks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Flu').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /read more/i }));
    expect(screen.getByText(/influenza viruses spread through droplets/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reopen/i }));
    expect(screen.getByText(/selected symptoms/i)).toBeInTheDocument();
  });

  it('shows a friendly error if prediction fails', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          disclaimer: 'Prediction could not be completed right now.',
        },
      },
    });

    render(<App />);
    await screen.findByText(/4 known symptoms/i);

    const searchInput = screen.getByLabelText(/search symptoms/i);
    await user.type(searchInput, 'hea');
    await user.click(await screen.findByRole('button', { name: /headache/i }));
    await user.click(screen.getByRole('button', { name: /analyze symptoms/i }));

    expect(await screen.findByText(/prediction could not be completed right now/i)).toBeInTheDocument();
  });
});
