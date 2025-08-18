import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ErrorNotification from './ErrorNotification.svelte';
import { errors, addError, clearErrors } from '$lib/stores/errorStore';
import { tick } from 'svelte';

describe('ErrorNotification', () => {
  beforeEach(() => {
    clearErrors();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when no errors exist', () => {
    render(ErrorNotification);
    
    // Should not find any error notifications
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('should render error notification', async () => {
    const { component } = render(ErrorNotification);
    
    addError('Test error message', 'error');
    await tick(); // Wait for Svelte to update
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('should render warning notification with correct styling', async () => {
    const { component } = render(ErrorNotification);
    
    addError('Test warning message', 'warning');
    await tick(); // Wait for Svelte to update
    
    const notification = screen.getByText('Test warning message').closest('div');
    expect(notification).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('should render info notification with correct styling', async () => {
    const { component } = render(ErrorNotification);
    
    addError('Test info message', 'info');
    await tick(); // Wait for Svelte to update
    
    const notification = screen.getByText('Test info message').closest('div');
    expect(notification).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('should dismiss error when dismiss button is clicked', async () => {
    const { component } = render(ErrorNotification);
    
    const errorId = addError('Test error message');
    await tick(); // Wait for Svelte to update
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await fireEvent.click(dismissButton);
    await tick(); // Wait for Svelte to update
    
    expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
  });

  it('should render multiple errors', async () => {
    const { component } = render(ErrorNotification);
    
    addError('First error', 'error');
    addError('Second error', 'warning');
    addError('Third error', 'info');
    await tick(); // Wait for Svelte to update
    
    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.getByText('Third error')).toBeInTheDocument();
    
    // Should have 3 dismiss buttons
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    expect(dismissButtons).toHaveLength(3);
  });

  it('should dismiss only the clicked error', async () => {
    const { component } = render(ErrorNotification);
    
    addError('First error', 'error');
    addError('Second error', 'warning');
    await tick(); // Wait for Svelte to update
    
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    
    // Click the first dismiss button
    await fireEvent.click(dismissButtons[0]);
    await tick(); // Wait for Svelte to update
    
    // One error should remain
    expect(screen.getAllByRole('button', { name: /dismiss/i })).toHaveLength(1);
  });
});