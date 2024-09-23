const routes = [
  {
    path: '/',
    component: () => import('layouts/app.layout.vue'),
    children: [
      { path: '', redirect: 'activities' },
      { path: 'activities', component: () => import('pages/activities.page.vue') },
      { path: 'scan/:id', component: () => import('pages/scan.page.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
