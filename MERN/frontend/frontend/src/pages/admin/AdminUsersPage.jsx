import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { adminApi } from '../../services/api';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';
import { FiSearch, FiFilter, FiUserCheck, FiUserX, FiShield, FiTrendingUp } from 'react-icons/fi';

const AdminUsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ role: '', status: '', verification: '', q: '' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.users(filters);
      setUsers(res?.data?.rows || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSelectUser = async (userId) => {
    try {
      const res = await adminApi.userProfile(userId);
      setSelectedUser(res?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleVerifyFinder = async (userId, isApproved) => {
    try {
      const reason = window.prompt('Provide verification notation (optional):') || '';
      await adminApi.verifyFinder(userId, { isApproved, reason });
      toast.success(isApproved ? 'Finder identity verified.' : 'Finder verification rejected.');
      await loadData();
      if (selectedUser?.user?._id === userId) await onSelectUser(userId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUserStatus = async (userId, status) => {
    try {
      const reason = window.prompt('Status revision reason:') || '';
      await adminApi.updateUserStatus(userId, { status, reason });
      toast.success(`User state transitioned to ${status}.`);
      await loadData();
      if (selectedUser?.user?._id === userId) await onSelectUser(userId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Entity Directory" 
        subtitle="Manage user lifecycles, role permissions, and trust-level verifications" 
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Users List Card */}
        <article className="admin-card flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Entities</h3>
            <div className="flex items-center gap-2">
               <FiFilter className="text-slate-500" />
               <select 
                 className="bg-transparent text-[10px] font-bold text-white uppercase tracking-wider outline-none border border-white/5 rounded px-2 py-1"
                 value={filters.role} 
                 onChange={(e) => setFilters(p => ({ ...p, role: e.target.value }))}
               >
                 <option value="">All Roles</option>
                 <option value="owner">Owner</option>
                 <option value="finder">Finder</option>
                 <option value="admin">Admin</option>
               </select>
            </div>
          </div>

          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
              placeholder="Search by identity, email, or locator..."
              value={filters.q}
              onChange={(e) => setFilters(p => ({ ...p, q: e.target.value }))}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
            {loading ? (
              <div className="py-40 flex justify-center"><LoadingSpinner /></div>
            ) : users.length === 0 ? (
              <EmptyState title="No matched entities" description="Try adjusting your filter parameters." />
            ) : (
              users.map((user) => (
                <div 
                  key={user._id} 
                  onClick={() => onSelectUser(user._id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedUser?.user?._id === user._id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.08]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm">{user.full_name}</p>
                    <div className="flex gap-1">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${user.role === 'finder' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-500'}`}>{user.role}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${user.accountStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{user.accountStatus}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{user.email}</p>
                  
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {user.role === 'finder' && user.isFinderVerified === false && (
                       <button onClick={() => handleVerifyFinder(user._id, true)} className="p-1 px-3 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black hover:bg-emerald-500/20 transition-all border border-emerald-500/20">VERIFY</button>
                    )}
                    <button onClick={() => handleUserStatus(user._id, user.accountStatus === 'active' ? 'suspended' : 'active')} className="p-1 px-3 bg-white/5 text-slate-400 rounded-lg text-[10px] font-black hover:bg-white/10 transition-all border border-white/5">{user.accountStatus === 'active' ? 'SUSPEND' : 'RESTORE'}</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        {/* User Deep View Card */}
        <article className="admin-card h-[700px] flex flex-col">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Deep Intelligence View</h3>
          
          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-center opacity-30">
               <div>
                 <FiShield size={48} className="mx-auto mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest">Select entity to inspect telemetry</p>
               </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-indigo-500/20 overflow-hidden">
                   {selectedUser.user.profileImage ? <img src={selectedUser.user.profileImage} className="w-full h-full object-cover" /> : selectedUser.user.full_name[0]}
                </div>
                <div>
                   <h2 className="text-xl font-black text-white">{selectedUser.user.full_name}</h2>
                   <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{selectedUser.user.role} Identity</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Success Propensity</span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-white">{selectedUser.analytics?.successRate || 0}%</span>
                    <FiTrendingUp className="text-emerald-500 mb-1" size={16} />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Average Rating</span>
                   <span className="text-2xl font-black text-amber-500">{(selectedUser.user.ratingAvg || 0).toFixed(1)}</span>
                </div>
              </div>

              <section className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Mission Interaction Meta</h4>
                 <div className="grid grid-cols-2 gap-y-4">
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Total Involvements</p>
                       <p className="text-sm font-black text-white">{selectedUser.analytics?.totalAssignments || 0}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Disputes Profile</p>
                       <p className="text-sm font-black text-white">{selectedUser.analytics?.disputes?.raised || 0} / {selectedUser.analytics?.disputes?.against || 0}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Lifetime Value</p>
                       <p className="text-sm font-black text-white">{formatCurrency(selectedUser.analytics?.ownerPayments?.total || 0)}</p>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 mb-1 font-bold">Earnings Realized</p>
                       <p className="text-sm font-black text-white">{formatCurrency(selectedUser.analytics?.finderEarnings?.totalProcessed || 0)}</p>
                    </div>
                 </div>
              </section>

              <section className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                 <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Integrity Flags</h4>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Teleport Jumps</span>
                       <span className={`font-black ${selectedUser.analytics?.tracking?.suspicion?.suspiciousJumps > 0 ? 'text-rose-500' : 'text-slate-500'}`}>{selectedUser.analytics?.tracking?.suspicion?.suspiciousJumps || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-wider">Long-Gap Inactivity</span>
                       <span className={`font-black ${selectedUser.analytics?.tracking?.suspicion?.noMovementLongGap > 0 ? 'text-amber-500' : 'text-slate-500'}`}>{selectedUser.analytics?.tracking?.suspicion?.noMovementLongGap || 0}</span>
                    </div>
                 </div>
              </section>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default AdminUsersPage;
