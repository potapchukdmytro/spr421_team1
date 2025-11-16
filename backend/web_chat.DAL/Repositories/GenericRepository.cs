using Microsoft.EntityFrameworkCore;
using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories
{
    public class GenericRepository<TEntity> : IGenericRepository<TEntity>
        where TEntity : class, IBaseEntity
    {
        protected readonly AppDbContext _context;

        public GenericRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task CreateAsync(TEntity entity)
        {
            await _context.Set<TEntity>().AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(TEntity entity)
        {
            _context.Set<TEntity>().Remove(entity);
            await _context.SaveChangesAsync();
        }

        public IQueryable<TEntity> GetAll()
        {
            return _context
                .Set<TEntity>()
                .AsNoTracking();
        }

        public async Task<TEntity?> GetByIdAsync(string id)
        {
            return await _context
                .Set<TEntity>()
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task UpdateAsync(TEntity entity)
        {
            _context.Set<TEntity>().Update(entity);
            await _context.SaveChangesAsync();
        }
    }
}
