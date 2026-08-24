import { describe, it, expect, beforeEach, vi } from 'vitest';
import notificationService from '../services/notificationService.js';

describe('Notification Service Unit & Integration Tests', () => {
    beforeEach(() => {
        notificationService.reset();
    });

    it('should generate order placed notification event', async () => {
        const order = { id: 'ord-101', amount: 500, payment_method: 'COD' };
        const res = await notificationService.sendOrderPlaced(order, '9876543210');
        expect(res.success).toBe(true);
        expect(res.log.eventType).toBe('ORDER_PLACED');
        expect(res.log.payload.amount).toBe(500);
        expect(res.log.payload.customerPhone).toBe('9876543210');
    });

    it('should enforce idempotency and prevent duplicate notification events for the same order and status', async () => {
        const order = { id: 'ord-102', amount: 750, payment_method: 'COD' };
        const first = await notificationService.sendOrderConfirmed(order, '9876543210');
        expect(first.success).toBe(true);
        expect(first.skipped).toBeUndefined();

        const duplicate = await notificationService.sendOrderConfirmed(order, '9876543210');
        expect(duplicate.success).toBe(true);
        expect(duplicate.skipped).toBe(true);
        expect(duplicate.reason).toBe('duplicate_event');
    });

    it('should dispatch different lifecycle status notifications independently', async () => {
        const order = { id: 'ord-103', amount: 1200, payment_method: 'COD' };
        const placed = await notificationService.sendOrderPlaced(order);
        const confirmed = await notificationService.sendOrderConfirmed(order);
        const dispatched = await notificationService.sendOrderDispatched(order);
        const delivered = await notificationService.sendOrderDelivered(order);

        expect(placed.success).toBe(true);
        expect(confirmed.success).toBe(true);
        expect(dispatched.success).toBe(true);
        expect(delivered.success).toBe(true);

        expect(notificationService.logs.length).toBe(4);
    });

    it('should handle cancellation notification event', async () => {
        const order = { id: 'ord-104', amount: 350, payment_method: 'COD' };
        const cancelled = await notificationService.sendOrderCancelled(order, '9123456789');
        expect(cancelled.success).toBe(true);
        expect(cancelled.log.eventType).toBe('ORDER_CANCELLED');
    });
});

describe('Low Stock & Inventory Operational Logic Tests', () => {
    const classifyStock = (stock, threshold = 5) => {
        const numericStock = parseInt(stock, 10);
        if (isNaN(numericStock) || numericStock <= 0) return 'Out of Stock';
        if (numericStock <= threshold) return 'Low Stock';
        return 'In Stock';
    };

    it('should classify stock <= 0 as Out of Stock', () => {
        expect(classifyStock(0)).toBe('Out of Stock');
        expect(classifyStock(-3)).toBe('Out of Stock');
    });

    it('should classify stock between 1 and 5 as Low Stock', () => {
        expect(classifyStock(1)).toBe('Low Stock');
        expect(classifyStock(3)).toBe('Low Stock');
        expect(classifyStock(5)).toBe('Low Stock');
    });

    it('should classify stock > 5 as In Stock', () => {
        expect(classifyStock(6)).toBe('In Stock');
        expect(classifyStock(50)).toBe('In Stock');
    });
});

describe('COD Summary Financial & Reconciliation Math', () => {
    const calculateCodSummary = (orders) => {
        let totalOrders = orders.length;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let codCollected = 0;
        let codExpected = 0;

        for (const order of orders) {
            const amt = parseFloat(order.amount || 0);
            if (order.status === 'Delivered') {
                deliveredOrders++;
                codCollected += amt;
            } else if (order.status === 'Cancelled') {
                cancelledOrders++;
            } else {
                codExpected += amt;
            }
        }

        return {
            totalOrders,
            deliveredOrders,
            cancelledOrders,
            codCollected: Math.round(codCollected * 100) / 100,
            codExpected: Math.round(codExpected * 100) / 100
        };
    };

    it('should correctly calculate COD collected vs expected across multiple orders', () => {
        const orders = [
            { id: '1', amount: 500, status: 'Delivered' },
            { id: '2', amount: 300, status: 'Delivered' },
            { id: '3', amount: 450, status: 'Order placed' },
            { id: '4', amount: 200, status: 'Dispatched' },
            { id: '5', amount: 600, status: 'Cancelled' }
        ];

        const summary = calculateCodSummary(orders);
        expect(summary.totalOrders).toBe(5);
        expect(summary.deliveredOrders).toBe(2);
        expect(summary.cancelledOrders).toBe(1);
        expect(summary.codCollected).toBe(800);
        expect(summary.codExpected).toBe(650);
    });

    it('should correctly format COD summary with empty order array', () => {
        const summary = calculateCodSummary([]);
        expect(summary.totalOrders).toBe(0);
        expect(summary.codCollected).toBe(0);
        expect(summary.codExpected).toBe(0);
    });
});

describe('Phone Number Normalization & Order Timeline Logic', () => {
    const normalizeIndianPhone = (input) => {
        if (!input || typeof input !== 'string') return '';
        const cleaned = input.replace(/\D/g, '');
        if (cleaned.length === 10) return `+91${cleaned}`;
        if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
        return cleaned;
    };

    const getTimelineIndex = (status) => {
        const steps = ['Order placed', 'Confirmed', 'Dispatched', 'Delivered'];
        return steps.indexOf(status);
    };

    it('should normalize 10-digit Indian phone numbers to E.164 format', () => {
        expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
        expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
        expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
    });

    it('should return -1 for non-standard order statuses in timeline', () => {
        expect(getTimelineIndex('Order placed')).toBe(0);
        expect(getTimelineIndex('Confirmed')).toBe(1);
        expect(getTimelineIndex('Dispatched')).toBe(2);
        expect(getTimelineIndex('Delivered')).toBe(3);
        expect(getTimelineIndex('Cancelled')).toBe(-1);
        expect(getTimelineIndex('Unknown')).toBe(-1);
    });
});

describe('Reorder Cart Stock Allocation & Prototype Safety', () => {
    const calculateReorderAddableQty = (requestedQty, currentStock, existingInCart) => {
        const availableInDb = Math.max(0, parseInt(currentStock, 10) || 0);
        const alreadyInCart = Math.max(0, parseInt(existingInCart, 10) || 0);
        const targetQty = Math.max(1, parseInt(requestedQty, 10) || 1);
        return Math.max(0, Math.min(targetQty, availableInDb - alreadyInCart));
    };

    it('should cap reorder quantity to available database stock', () => {
        expect(calculateReorderAddableQty(5, 3, 0)).toBe(3);
        expect(calculateReorderAddableQty(2, 10, 0)).toBe(2);
    });

    it('should account for items already present in the customer cart', () => {
        expect(calculateReorderAddableQty(5, 10, 8)).toBe(2);
        expect(calculateReorderAddableQty(2, 5, 5)).toBe(0);
    });

    it('should return 0 addable quantity when product is completely out of stock', () => {
        expect(calculateReorderAddableQty(3, 0, 0)).toBe(0);
    });

    it('should safely sanitize cart object without prototype pollution vulnerability', () => {
        const rawCart = JSON.parse('{"__proto__": {"admin": true}, "prod-1": 2}');
        const safeCart = Object.assign(Object.create(null), rawCart);

        expect(safeCart['prod-1']).toBe(2);
        expect(Object.prototype.admin).toBeUndefined();
    });

    it('should allow clearing notification service state on reset', () => {
        notificationService.sendOrderPlaced({ id: 'ord-test', amount: 100 });
        expect(notificationService.logs.length).toBeGreaterThan(0);
        notificationService.reset();
        expect(notificationService.logs.length).toBe(0);
        expect(notificationService.processedEvents.size).toBe(0);
    });

    it('should handle dispatch failure gracefully without throwing exception (non-blocking)', async () => {
        const faultyPayloadBuilder = () => { throw new Error('Provider Timeout'); };
        const result = await notificationService.dispatch('ord-error', 'TEST_EVENT', faultyPayloadBuilder);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Provider Timeout');
    });

    it('should calculate correct reorder quantity when cart already holds maximum stock', () => {
        expect(calculateReorderAddableQty(10, 5, 5)).toBe(0);
        expect(calculateReorderAddableQty(1, 1, 1)).toBe(0);
    });
});



