import { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useUser } from '../../../../shared/context/UserContext';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [name, setName] = useState('');
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const user = await response.json();
      setUser({ id: user.id, name: user.name });
      navigate('/dashboard');
    }
  };

  return (
    <Card style={{ width: '400px' }}>
      <Card.Body>
        <h2 className="text-center mb-4">Test Meet</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tu nombre</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingresa tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100">
            Continuar
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}