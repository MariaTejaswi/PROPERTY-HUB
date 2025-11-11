# React Component Templates

Quick templates to speed up your development. Copy and modify as needed!

## Button Component

**File**: `client/src/components/common/Button.jsx`
```jsx
import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const className = `${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${disabled || loading ? styles.disabled : ''}`;
  
  return (
    <button 
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
```

**File**: `client/src/components/common/Button.module.css`
```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.button:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.primary {
  background-color: var(--primary);
  color: white;
}

.primary:hover:not(.disabled) {
  background-color: var(--primary-dark);
}

.secondary {
  background-color: var(--secondary);
  color: white;
}

.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fullWidth {
  width: 100%;
}
```

---

## Card Component

**File**: `client/src/components/common/Card.jsx`
```jsx
import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, title, actions, className = '' }) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Card;
```

**File**: `client/src/components/common/Card.module.css`
```css
.card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border);
}

.title {
  margin: 0;
  font-size: 1.25rem;
}

.content {
  padding: var(--spacing-lg);
}
```

---

## Modal Component

**File**: `client/src/components/common/Modal.jsx`
```jsx
import React, { useEffect } from 'react';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
```

---

## Login Page Template

**File**: `client/src/pages/Login.jsx`
```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import styles from './Auth.module.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

---

## Dashboard Template

**File**: `client/src/pages/Dashboard.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, isLandlord, isTenant } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch relevant stats based on role
      if (isLandlord) {
        const [properties, payments, maintenance] = await Promise.all([
          api.get('/properties'),
          api.get('/payments/stats'),
          api.get('/maintenance/stats')
        ]);
        
        setStats({
          properties: properties.data.count,
          payments: payments.data.stats,
          maintenance: maintenance.data.stats
        });
      } else if (isTenant) {
        const [payments, maintenance] = await Promise.all([
          api.get('/payments'),
          api.get('/maintenance')
        ]);
        
        setStats({
          payments: payments.data.count,
          maintenance: maintenance.data.count
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.dashboard}>
      <h1>Welcome, {user.name}!</h1>
      
      <div className={styles.statsGrid}>
        {isLandlord && (
          <>
            <Card title="Properties">
              <div className={styles.statNumber}>{stats.properties}</div>
            </Card>
            <Card title="Total Revenue">
              <div className={styles.statNumber}>
                ${stats.payments?.totalPaid || 0}
              </div>
            </Card>
            <Card title="Pending Payments">
              <div className={styles.statNumber}>
                ${stats.payments?.totalPending || 0}
              </div>
            </Card>
            <Card title="Maintenance Requests">
              <div className={styles.statNumber}>
                {stats.maintenance?.byStatus?.length || 0}
              </div>
            </Card>
          </>
        )}
        
        {isTenant && (
          <>
            <Card title="My Payments">
              <div className={styles.statNumber}>{stats.payments}</div>
            </Card>
            <Card title="My Requests">
              <div className={styles.statNumber}>{stats.maintenance}</div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## Property List Template

**File**: `client/src/pages/Properties.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';
import styles from './Properties.module.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.properties}>
      <div className={styles.header}>
        <h1>Properties</h1>
        <Link to="/properties/new">
          <Button>Add Property</Button>
        </Link>
      </div>

      <div className={styles.grid}>
        {properties.map((property) => (
          <Card key={property._id} title={property.name}>
            <p>{property.address.street}</p>
            <p>{property.address.city}, {property.address.state}</p>
            <p className={styles.rent}>{formatCurrency(property.rentAmount)}/month</p>
            <p className={styles.status}>{property.status}</p>
            <Link to={`/properties/${property._id}`}>
              <Button variant="secondary" fullWidth>View Details</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Properties;
```

---

## Demo Payment Gateway Template

**File**: `client/src/components/payments/DemoPaymentGateway.jsx`
```jsx
import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import { TEST_CARDS } from '../../utils/constants';
import styles from './DemoPaymentGateway.module.css';

const DemoPaymentGateway = ({ paymentId, amount, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    zipCode: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await api.post(`/payments/${paymentId}/process`, formData);
      onSuccess(response.data);
    } catch (error) {
      onError(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const fillTestCard = (cardNumber) => {
    setFormData({
      ...formData,
      cardNumber,
      expiryMonth: '12',
      expiryYear: '25',
      cvv: '123',
      zipCode: '12345'
    });
  };

  return (
    <div className={styles.gateway}>
      <h3>Payment Amount: ${amount}</h3>
      
      <div className={styles.testCards}>
        <p>Test Cards:</p>
        <button onClick={() => fillTestCard(TEST_CARDS.SUCCESS)}>Success</button>
        <button onClick={() => fillTestCard(TEST_CARDS.DECLINED)}>Declined</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Card Number"
          value={formData.cardNumber}
          onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
          required
        />
        
        <div className={styles.row}>
          <input
            type="text"
            placeholder="MM"
            value={formData.expiryMonth}
            onChange={(e) => setFormData({...formData, expiryMonth: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="YY"
            value={formData.expiryYear}
            onChange={(e) => setFormData({...formData, expiryYear: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="CVV"
            value={formData.cvv}
            onChange={(e) => setFormData({...formData, cvv: e.target.value})}
            required
          />
        </div>

        <Button type="submit" fullWidth loading={processing}>
          Pay Now
        </Button>
      </form>
    </div>
  );
};

export default DemoPaymentGateway;
```

---

## Canvas Signature Pad Template

**File**: `client/src/components/leases/SignaturePad.jsx`
```jsx
import React, { useRef, useState, useEffect } from 'react';
import Button from '../common/Button';
import styles from './SignaturePad.module.css';

const SignaturePad = ({ onSave, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setIsEmpty(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const save = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className={styles.signaturePad}>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className={styles.buttons}>
        <Button onClick={clear} variant="secondary">Clear</Button>
        <Button onClick={save} disabled={isEmpty}>Save Signature</Button>
      </div>
    </div>
  );
};

export default SignaturePad;
```

---

Use these templates as starting points and customize them for your needs!
