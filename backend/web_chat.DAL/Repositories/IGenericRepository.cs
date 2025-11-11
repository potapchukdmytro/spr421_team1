using web_chat.DAL.Entities;

namespace web_chat.DAL.Repositories
{
    public interface IGenericRepository<TEntity>
        where TEntity : class,IBaseEntity
    {
        Task CreateAsync(TEntity entity);
        Task UpdateAsync(TEntity entity);
        Task DeleteAsync(TEntity entity);
        Task<TEntity?> GetByIdAsync(string id);
        IQueryable<TEntity> GetAll();
    }
}
