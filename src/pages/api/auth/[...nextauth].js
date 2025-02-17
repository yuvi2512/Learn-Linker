import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import User  from '../../../models/user';
import bcrypt from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await User.findOne({ where: { email: credentials.email } });
        if (!user) {
          throw new Error('No user found with that email');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error('Password is incorrect');
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    })
  ],
  debug: true,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});
