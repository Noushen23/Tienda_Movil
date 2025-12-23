import { StyleSheet } from 'react-native';

// Estilos compartidos para catalog y services
export const catalogStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f9fafb"
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#7783a6',
    fontWeight: '600',
    letterSpacing: 0.18
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 11,
    paddingHorizontal: 18,
    gap: 10,
    backgroundColor: "#f1f5fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e7ec"
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f1f5fa',
    borderRadius: 25,
    paddingHorizontal: 13,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: '#e1e6f0',
    marginRight: 9,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    minHeight: 41
  },
  searchIcon: {
    marginRight: 5,
    marginLeft: 2,
    color: '#3b82f6',
    opacity: 0.8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 6,
    minHeight: 41,
    fontWeight: '500',
    letterSpacing: 0.13
  },
  filterButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#eef4fc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    // elevation: 2,
    marginRight: 7
  },
  filterBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#eaf3fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9eaf1',
    marginBottom: 2,
    borderRadius: 7
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  activeFiltersText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 0.09
  },
  clearFiltersButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#fef2f2"
  },
  categorySelectorContainer: {
    marginBottom: 0,
    backgroundColor: '#f9fbfd',
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e6eaf2',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    // elevation: 0,
  },
  productsList: {
    paddingTop: 9,
    paddingBottom: 21,
  },
  servicesList: {
    paddingTop: 9,
    paddingBottom: 21,
  },
  productCard: {
    borderRadius: 15,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 6,
    shadowColor: '#255bee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // elevation: 2,
    borderWidth: 1.2,
    borderColor: '#e9eaf1',
    overflow: 'hidden',
    position: 'relative'
  },
  serviceCard: {
    borderRadius: 15,
    backgroundColor: '#fff',
    marginBottom: 16,
    marginHorizontal: 6,
    shadowColor: '#255bee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // elevation: 2,
    borderWidth: 1.2,
    borderColor: '#e9eaf1',
    overflow: 'hidden',
    position: 'relative'
  },
  productImage: {
    backgroundColor: '#eceffc',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%'
  },
  serviceImage: {
    backgroundColor: '#eceffc',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%'
  },
  productImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: "#f5f7fa"
  },
  serviceImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: "#f5f7fa"
  },
  noImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fc',
    borderRadius: 12,
  },
  noImageText: {
    marginTop: 5,
    fontSize: 11,
    color: '#a8afbf',
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.81
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    // elevation: 2,
    zIndex: 3
  },
  productInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 3,
    paddingBottom: 11,
    backgroundColor: '#fff'
  },
  serviceInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 3,
    paddingBottom: 11,
    backgroundColor: '#fff'
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22232F',
    lineHeight: 21,
    marginBottom: 2,
    letterSpacing: 0.16
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22232F',
    lineHeight: 21,
    marginBottom: 2,
    letterSpacing: 0.16
  },
  productDescription: {
    color: '#a1aac6',
    marginBottom: 5,
    lineHeight: 15,
    letterSpacing: 0.19,
    fontWeight: '500'
  },
  serviceDescription: {
    color: '#a1aac6',
    marginBottom: 5,
    lineHeight: 18,
    letterSpacing: 0.19,
    fontWeight: '500'
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e66e9',
    marginTop: -3
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e66e9',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 1,
    marginBottom: 0,
    gap: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 55,
    backgroundColor: "#f9fafb"
  },
  emptyText: {
    fontSize: 16,
    color: '#bfc8de',
    marginTop: 13,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 25,
    fontWeight: "600"
  },
  emptySubtext: {
    fontSize: 13,
    color: '#c4cbd8',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 25,
    fontWeight: "500"
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: "#f9fafb"
  },
  errorText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 13,
    textAlign: 'center',
    lineHeight: 23,
  },
  errorSubtext: {
    fontSize: 13,
    color: '#b3b9c6',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 22,
    fontWeight: "500",
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#7b889a',
    fontWeight: '600',
  },
  // Estilos específicos de productos
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5fa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    // elevation: 1,
  },
  categoryText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f7ff',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 0,
    marginBottom: 15,
    marginLeft: 0,
    marginRight: 0,
  },
  stockText: {
    marginLeft: 4,
    fontWeight: '600',
    flexShrink: 1,
    fontSize: 10
  },
  originalPrice: {
    fontSize: 12,
    color: '#b3b9c6',
    textDecorationLine: 'line-through',
    marginBottom: 2,
    fontWeight: '500'
  },
  offerBadge: {
    position: 'absolute',
    top: 10,
    left: 13,
    backgroundColor: '#f43f5e',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    zIndex: 2,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
  },
  offerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#4263eb',
    width: 34,
    height: 34,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2d4665',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    // elevation: 4,
    zIndex: 3
  },
  // Estilos específicos de servicios
  serviceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // elevation: 2,
  },
  serviceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef4fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoBadgeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',   // Fondo gris claro
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#000000',       // Negro
     shadowColor: '#000000',       // Negro
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.15,
     shadowRadius: 3,
    // elevation: 2,
  },
  favoriteBadgeText: {
    fontSize: 11,
    color: '#000000',             // Negro
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
});

