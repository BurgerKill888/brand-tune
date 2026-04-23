

## Objectif

Supprimer la barrière d'authentification pour entrer directement dans l'application, sans écran de connexion.

## Contexte

Actuellement, `src/pages/Index.tsx` affiche `<AuthForm />` si aucun utilisateur n'est connecté. De plus, plusieurs hooks (`usePosts`, `useBrandProfile`, `useWatchItems`, etc.) bloquent leurs requêtes tant qu'il n'y a pas d'utilisateur authentifié, et les politiques RLS Supabase exigent un `user_id`.

Il faut donc à la fois retirer l'écran de login **et** corriger les erreurs de build TypeScript existantes pour que l'app compile et tourne.

## Approche

### 1. Bypass de l'authentification

Deux options possibles — je recommande l'**Option A** (plus simple, immédiat) :

**Option A — Connexion anonyme automatique (recommandée)**
- Au chargement de l'app, si aucun utilisateur n'est connecté, créer automatiquement une session anonyme via `supabase.auth.signInAnonymously()`.
- L'utilisateur entre directement dans le dashboard sans voir d'écran de login.
- Les RLS policies continuent de fonctionner (chaque visiteur a un `user_id` unique).
- Inconvénient : si l'utilisateur change de navigateur/appareil, il perd ses données (pas de lien entre sessions).

**Option B — Mode totalement local sans backend auth**
- Retirer l'authentification, stocker tout en localStorage.
- Beaucoup plus de refonte (tous les hooks Supabase à réécrire). Non recommandé vu la quantité de code existant.

### 2. Modifications fichiers

**`src/pages/Index.tsx`**
- Supprimer le bloc `if (!authLoading && !user) return <AuthForm />`.
- Ajouter un `useEffect` qui appelle `signInAnonymously()` automatiquement si pas de user.
- Retirer l'import de `AuthForm`.
- Corriger les erreurs TS au passage (voir section 3).

**`src/hooks/useAuth.ts`**
- Ajouter une méthode `signInAnonymously` exposée par le hook.

**Activation côté backend (Lovable Cloud)**
- Activer "Allow anonymous sign-ins" dans la configuration auth Supabase. Sera fait automatiquement via l'outil de configuration auth lors du passage en mode default.

### 3. Correction des erreurs de build (bloquantes)

Ces erreurs empêchent l'app de tourner — à corriger en parallèle :

- **`src/pages/Index.tsx:36`** — `usePosts` ne retourne pas `updatePost`. Ajouter la méthode `updatePost` dans `src/hooks/usePosts.ts` (upsert sur la ligne existante).
- **`src/pages/Index.tsx:135`** et **`FreePostView.tsx:142`** / **`PostsView.tsx:1064`** — La propriété `type` n'existe pas sur `Post`. Ajouter `type?: string` et `metadata?: Record<string, any>` dans l'interface `Post` (`src/types/index.ts`).
- **`supabase/functions/assist-post/index.ts:182`** — `error` est `unknown`. Caster en `error instanceof Error ? error.message : 'Internal server error'`.

## Détails techniques

```ts
// useAuth.ts — ajout
const signInAnonymously = async () => {
  return await supabase.auth.signInAnonymously();
};

// Index.tsx — remplacement du gate AuthForm
useEffect(() => {
  if (!authLoading && !user) {
    supabase.auth.signInAnonymously();
  }
}, [authLoading, user]);

// Plus de return <AuthForm />
```

```ts
// types/index.ts — ajout dans Post
export interface Post {
  // ... existing
  type?: string;
  metadata?: Record<string, any>;
}
```

```ts
// hooks/usePosts.ts — ajout
const updatePost = async (id: string, updates: Partial<Post>) => {
  const existing = posts.find(p => p.id === id);
  if (!existing) return { error: new Error('Not found') };
  return savePost({ ...existing, ...updates, updatedAt: new Date() });
};
return { posts, loading, savePost, updatePost, deletePost, refreshPosts: fetchPosts };
```

## Résultat attendu

- Au chargement de l'app, l'utilisateur arrive directement sur le Dashboard.
- Aucune saisie de login/mot de passe requise.
- Toutes les fonctionnalités (posts, idées, calendrier, veille) restent opérationnelles.
- Le build compile sans erreur.

## Hors scope

- Page `/auth` et composant `AuthForm` : conservés dans le code mais non utilisés (peuvent être réactivés plus tard si besoin).
- Migration des données entre sessions anonymes (non géré ici).

