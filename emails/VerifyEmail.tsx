// emails/VerifyEmail.tsx
import { Html, Body, Container, Text, Heading } from '@react-email/components';
import * as React from 'react';

export default function VerifyEmail({ otp }: { otp: string }) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#f0fdf4', fontFamily: 'sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #d9f99d', textAlign: 'center' }}>
          <Heading style={{ color: '#65a30d', fontSize: '24px', fontWeight: 'bold' }}>Quantix Solaris</Heading>
          <Text style={{ color: '#4d7c0f', fontSize: '16px' }}>Your 6-digit verification code is:</Text>
          <Text style={{ fontSize: '36px', fontWeight: 'bold', letterSpacing: '8px', color: '#052e16', margin: '20px 0' }}>
            {otp}
          </Text>
          <Text style={{ color: '#4d7c0f', fontSize: '14px' }}>This code will expire in 3 minutes.</Text>
        </Container>
      </Body>
    </Html>
  );
}